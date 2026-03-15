import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, users } from '@/lib/db/schema'
import { sendOverdueEquipmentEmail } from '@/lib/server/notification-emails'
import { getActiveCompanyId } from '@/lib/server/company'
import { createNotification } from '@/lib/server/notifications'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories'] as const
const workflowStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming'] as const

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const [items, activeBorrows] = await Promise.all([
    db.query.resources.findMany({
      where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
    }),
    db.query.reservations.findMany({
      where: and(
        eq(reservations.companyId, companyId),
        eq(reservations.type, 'equipment'),
        inArray(reservations.status, workflowStatuses)
      ),
      with: {
        user: true,
      },
    }),
  ])

  const now = new Date()
  const overdueIssued = activeBorrows.filter((reservation) => reservation.status === 'issued' && reservation.endAt < now)

  if (overdueIssued.length > 0) {
    await db
      .update(reservations)
      .set({ status: 'active' })
      .where(inArray(reservations.id, overdueIssued.map((reservation) => reservation.id)))

    await Promise.allSettled(
      overdueIssued.map((reservation) =>
        sendOverdueEquipmentEmail({
          recipient: {
            email: reservation.user?.email,
            name: reservation.user?.name,
          },
          resourceName: reservation.name,
          dueAt: reservation.endAt,
        })
      )
    )

    await Promise.allSettled(
      overdueIssued
        .filter((reservation) => Boolean(reservation.userId))
        .map((reservation) =>
          createNotification({
            companyId,
            userId: reservation.userId!,
            type: 'reminder',
            title: 'Termin zwrotu minol',
            message: `Termin zwrotu zasobu ${reservation.name} minol dnia ${reservation.endAt.toISOString().slice(0, 10)}.`,
          })
        )
    )
  }

  const activeBorrowByResource = new Map<string, (typeof activeBorrows)[number]>()
  for (const reservation of activeBorrows) {
    if (!reservation.resourceId) {
      continue
    }

    const existing = activeBorrowByResource.get(reservation.resourceId)
    if (!existing || existing.createdAt < reservation.createdAt) {
      activeBorrowByResource.set(reservation.resourceId, reservation)
    }
  }

  return NextResponse.json(
    items.map((item) => {
      const reservation = activeBorrowByResource.get(item.id)
      const user = reservation?.user as typeof users.$inferSelect | undefined

      const workflowStatus = reservation?.status || null

      return {
        ...item,
        workflowStatus,
        workflowReservationId: reservation?.id || null,
        requestedBy: user?.name || undefined,
        borrowedBy: user?.name || undefined,
        returnDate: reservation?.endAt ? reservation.endAt.toISOString().slice(0, 10) : undefined,
      }
    })
  )
}
