import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations, resources } from '@/lib/db/schema'
import { sendReservationCancelledEmail } from '@/lib/server/notification-emails'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function POST(request: Request) {
  const body = await request.json()
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const reservation = await db.query.reservations.findFirst({
    where: and(eq(reservations.companyId, companyId), eq(reservations.targetId, body.targetId), eq(reservations.type, body.type)),
    orderBy: [desc(reservations.startAt)],
    with: {
      user: true,
    },
  })

  const isAdminAction = await canManageCompany(companyId)

  if (reservation) {
    await db.update(reservations).set({ status: 'cancelled' }).where(eq(reservations.id, reservation.id))

    if (isAdminAction && actor.user?.id !== reservation.userId) {
      await sendReservationCancelledEmail({
        recipient: {
          email: reservation.user?.email,
          name: reservation.user?.name,
        },
        reservationLabel: reservation.name,
      })
    }
  }

  if (body.type === 'desk') {
    await db
      .update(floorElements)
      .set({ status: 'available', reservedBy: null, reservedUntil: null })
      .where(eq(floorElements.id, body.targetId))
  }

  if (body.type === 'room') {
    const room = await db.query.floorElements.findFirst({ where: eq(floorElements.id, body.targetId) })
    if (room) {
      const nextSlots = (room.timeSlots || []).map((slot: any) => ({
        ...slot,
        available: true,
        bookedBy: undefined,
        meetingTitle: undefined,
      }))
      await db.update(floorElements).set({ timeSlots: nextSlots }).where(eq(floorElements.id, body.targetId))
    }
  }

  if (body.type === 'equipment') {
    await db.update(resources).set({ status: 'available' }).where(eq(resources.id, body.targetId))
  }

  return NextResponse.json({ ok: true })
}
