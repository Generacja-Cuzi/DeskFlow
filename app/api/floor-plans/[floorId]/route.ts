import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, floors, reservations } from '@/lib/db/schema'
import { sendDeskOrRoomRemovedEmail } from '@/lib/server/notification-emails'
import { getActiveCompanyId } from '@/lib/server/company'
import { createNotification } from '@/lib/server/notifications'

const blockingStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming'] as const

export async function DELETE(_: Request, context: { params: Promise<{ floorId: string }> }) {
  const { floorId } = await context.params
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const floor = await db.query.floors.findFirst({
    where: and(eq(floors.id, floorId), eq(floors.companyId, companyId)),
  })

  if (!floor) {
    return NextResponse.json({ error: 'Floor not found' }, { status: 404 })
  }

  const elements = await db.query.floorElements.findMany({
    where: eq(floorElements.floorId, floorId),
  })

  const reservableElements = elements.filter(
    (
      element
    ): element is typeof element & {
      type: 'desk' | 'room'
    } => element.type === 'desk' || element.type === 'room'
  )

  if (reservableElements.length > 0) {
    const reservationsToCancel = await db.query.reservations.findMany({
      where: and(
        eq(reservations.companyId, companyId),
        inArray(
          reservations.targetId,
          reservableElements.map((element) => element.id)
        ),
        inArray(reservations.status, blockingStatuses)
      ),
      with: {
        user: true,
      },
    })

    if (reservationsToCancel.length > 0) {
      await db
        .update(reservations)
        .set({ status: 'cancelled' })
        .where(inArray(reservations.id, reservationsToCancel.map((reservation) => reservation.id)))

      const byId = new Map(reservableElements.map((element) => [element.id, element]))

      await Promise.allSettled(
        reservationsToCancel.map((reservation) => {
          const removedElement = byId.get(reservation.targetId)
          if (!removedElement) {
            return Promise.resolve()
          }

          return sendDeskOrRoomRemovedEmail({
            recipient: {
              email: reservation.user?.email,
              name: reservation.user?.name,
            },
            itemType: removedElement.type,
            itemName: removedElement.name,
            floorName: floor.name,
            companyId,
            userId: reservation.userId || undefined,
          })
        })
      )

      await Promise.allSettled(
        reservationsToCancel
          .filter((reservation) => Boolean(reservation.userId))
          .map((reservation) => {
            const removedElement = byId.get(reservation.targetId)
            if (!removedElement) {
              return Promise.resolve()
            }

            return createNotification({
              companyId,
              userId: reservation.userId!,
              type: 'rejection',
              title: removedElement.type === 'desk' ? 'Rezerwacja biurka anulowana' : 'Rezerwacja sali anulowana',
              message: `${removedElement.type === 'desk' ? 'Biurko' : 'Sala'} ${removedElement.name} zostalo usuniete razem z pietrem ${floor.name}.`,
            })
          })
      )
    }
  }

  await db.delete(floors).where(and(eq(floors.id, floorId), eq(floors.companyId, companyId)))

  return NextResponse.json({ ok: true })
}
