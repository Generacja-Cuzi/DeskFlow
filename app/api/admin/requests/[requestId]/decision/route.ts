import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations } from '@/lib/db/schema'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function PATCH(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const actor = await getActor()

  if (!actor.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { requestId } = await context.params
  const body = await request.json()
  const decision = body?.decision === 'approve' ? 'approve' : body?.decision === 'reject' ? 'reject' : null

  if (!decision) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  const reservation = await db.query.reservations.findFirst({
    where: and(eq(reservations.id, requestId), eq(reservations.companyId, companyId)),
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (reservation.type !== 'equipment') {
    return NextResponse.json({ error: 'Only equipment requests can be moderated here' }, { status: 400 })
  }

  if (decision === 'approve') {
    await db
      .update(reservations)
      .set({
        pendingApproval: false,
        status: 'approved',
      })
      .where(and(eq(reservations.id, requestId), eq(reservations.companyId, companyId)))

    return NextResponse.json({ ok: true })
  }

  await db
    .update(reservations)
    .set({
      pendingApproval: false,
      status: 'rejected',
    })
    .where(and(eq(reservations.id, requestId), eq(reservations.companyId, companyId)))

  return NextResponse.json({ ok: true })
}
