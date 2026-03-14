import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, floors, reservations } from '@/lib/db/schema'
import { sendDeskOrRoomRemovedEmail } from '@/lib/server/notification-emails'
import { getActiveCompanyId } from '@/lib/server/company'
import { getFloorPlans } from '@/lib/server/floor-plans'

const blockingStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming'] as const

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const floorPlans = await getFloorPlans(companyId)
  return NextResponse.json(floorPlans)
}

export async function POST(request: Request) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const floorPlan = await request.json()
  const removedReservationNotifications: Array<{
    email?: string
    name?: string
    itemType: 'desk' | 'room'
    itemName: string
    floorName: string
  }> = []

  await db.transaction(async (tx) => {
    const existing = await tx.query.floors.findFirst({ where: eq(floors.id, floorPlan.id) })
    const existingElements = await tx.query.floorElements.findMany({ where: eq(floorElements.floorId, floorPlan.id) })

    if (!existing) {
      await tx.insert(floors).values({
        id: floorPlan.id,
        companyId,
        name: floorPlan.name,
        floorNumber: floorPlan.floorNumber,
        canvasWidth: floorPlan.canvasWidth || 1200,
        canvasHeight: floorPlan.canvasHeight || 800,
      })
    } else {
      await tx
        .update(floors)
        .set({
          name: floorPlan.name,
          floorNumber: floorPlan.floorNumber,
          canvasWidth: floorPlan.canvasWidth || 1200,
          canvasHeight: floorPlan.canvasHeight || 800,
          updatedAt: new Date(),
        })
        .where(and(eq(floors.id, floorPlan.id), eq(floors.companyId, companyId)))
    }

    const nextElementIds = new Set(
      Array.isArray(floorPlan.elements) ? floorPlan.elements.map((element: any) => element.id).filter(Boolean) : []
    )

    const removedReservableElements = existingElements.filter(
      (
        element
      ): element is typeof element & {
        type: 'desk' | 'room'
      } => (element.type === 'desk' || element.type === 'room') && !nextElementIds.has(element.id)
    )

    if (removedReservableElements.length > 0) {
      const removedIds = removedReservableElements.map((element) => element.id)

      const impactedReservations = await tx.query.reservations.findMany({
        where: and(
          eq(reservations.companyId, companyId),
          inArray(reservations.targetId, removedIds),
          inArray(reservations.status, blockingStatuses)
        ),
        with: {
          user: true,
        },
      })

      if (impactedReservations.length > 0) {
        await tx
          .update(reservations)
          .set({ status: 'cancelled' })
          .where(inArray(reservations.id, impactedReservations.map((reservation) => reservation.id)))

        const byId = new Map(removedReservableElements.map((element) => [element.id, element]))

        for (const reservation of impactedReservations) {
          const removedElement = byId.get(reservation.targetId)
          if (!removedElement) {
            continue
          }

          removedReservationNotifications.push({
            email: reservation.user?.email,
            name: reservation.user?.name,
            itemType: removedElement.type,
            itemName: removedElement.name,
            floorName: floorPlan.name,
          })
        }
      }
    }

    await tx.delete(floorElements).where(eq(floorElements.floorId, floorPlan.id))

    if (Array.isArray(floorPlan.elements) && floorPlan.elements.length) {
      await tx.insert(floorElements).values(
        floorPlan.elements.map((element: any) => ({
          id: element.id,
          floorId: floorPlan.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation || 0,
          name: element.name,
          capacity: element.capacity ?? null,
          equipment: element.equipment || [],
          floor: element.floor ?? floorPlan.floorNumber,
          status: element.status || null,
          reservedBy: element.reservedBy || null,
          reservedUntil: element.reservedUntil || null,
          timeSlots: element.timeSlots || [],
          zone: element.zone || null,
          description: element.description || null,
          labelFontFamily: element.labelFontFamily || null,
          labelFontSize: element.labelFontSize ?? null,
          labelColor: element.labelColor || null,
          labelOffsetX: element.labelOffsetX ?? null,
          labelOffsetY: element.labelOffsetY ?? null,
        }))
      )
    }
  })

  await Promise.allSettled(
    removedReservationNotifications.map((item) =>
      sendDeskOrRoomRemovedEmail({
        recipient: {
          email: item.email,
          name: item.name,
        },
        itemType: item.itemType,
        itemName: item.itemName,
        floorName: item.floorName,
      })
    )
  )

  return NextResponse.json({ ok: true })
}
