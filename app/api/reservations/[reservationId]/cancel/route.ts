import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations, resources } from '@/lib/db/schema'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import { createNotification } from '@/lib/server/notifications'

export async function PATCH(_: Request, context: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await context.params
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const reservation = await db.query.reservations.findFirst({
    where: and(eq(reservations.id, reservationId), eq(reservations.companyId, companyId)),
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  const manager = await canManageCompany(companyId)
  const ownsReservation = Boolean(actor.user?.id && reservation.userId === actor.user.id)

  if (!manager && !ownsReservation) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (reservation.status === 'completed' || reservation.status === 'rejected') {
    return NextResponse.json({ error: 'Reservation can no longer be cancelled' }, { status: 409 })
  }

  if (reservation.type === 'equipment' && reservation.status === 'issued') {
    return NextResponse.json({ error: 'Issued equipment must be returned by admin' }, { status: 409 })
  }

  await db
    .update(reservations)
    .set({ status: 'cancelled' })
    .where(and(eq(reservations.id, reservationId), eq(reservations.companyId, companyId)))

  if (reservation.type === 'desk') {
    await db
      .update(floorElements)
      .set({ status: 'available', reservedBy: null, reservedUntil: null })
      .where(eq(floorElements.id, reservation.targetId))
  }

  if (reservation.type === 'equipment' && reservation.resourceId) {
    await db
      .update(resources)
      .set({ status: 'available' })
      .where(eq(resources.id, reservation.resourceId))
  }

  if (manager && !ownsReservation && reservation.userId) {
    await createNotification({
      companyId,
      userId: reservation.userId,
      type: 'rejection',
      title: 'Rezerwacja anulowana',
      message: `Administrator anulowal rezerwacje: ${reservation.name}.`,
    })
  }

  return NextResponse.json({ ok: true })
}
