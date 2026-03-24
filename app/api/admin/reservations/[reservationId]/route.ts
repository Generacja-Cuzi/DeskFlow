import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations } from '@/lib/db/schema'
import { sendReservationCancelledEmail } from '@/lib/server/notification-emails'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function DELETE(_: Request, context: { params: Promise<{ reservationId: string }> }) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reservationId } = await context.params

  const existing = await db.query.reservations.findFirst({
    where: and(eq(reservations.id, reservationId), eq(reservations.companyId, companyId)),
    with: {
      user: true,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  await db.delete(reservations).where(and(eq(reservations.id, reservationId), eq(reservations.companyId, companyId)))

  await sendReservationCancelledEmail({
    recipient: {
      email: existing.user?.email,
      name: existing.user?.name,
    },
    reservationLabel: existing.name,
    reason: 'Rezerwacja zostala usunieta przez administratora.',
    companyId,
    userId: existing.userId || undefined,
  })

  return NextResponse.json({ ok: true })
}
