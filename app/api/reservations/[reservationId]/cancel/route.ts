import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations, resources } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

export async function PATCH(_: Request, context: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await context.params
  const companyId = await getActiveCompanyId()

  const reservation = await db.query.reservations.findFirst({
    where: and(eq(reservations.id, reservationId), eq(reservations.companyId, companyId)),
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
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

  return NextResponse.json({ ok: true })
}
