import { and, desc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function PATCH(request: Request, context: { params: Promise<{ resourceId: string }> }) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { resourceId } = await context.params
  const body = await request.json()
  const action = body?.action

  if (action !== 'issue' && action !== 'return') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const resource = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  if (action === 'issue') {
    const approvedReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.companyId, companyId),
        eq(reservations.type, 'equipment'),
        eq(reservations.resourceId, resourceId),
        eq(reservations.status, 'approved')
      ),
      orderBy: [desc(reservations.createdAt)],
    })

    if (!approvedReservation) {
      return NextResponse.json({ error: 'No approved request to issue' }, { status: 409 })
    }

    await db
      .update(reservations)
      .set({
        status: 'issued',
        pendingApproval: false,
      })
      .where(eq(reservations.id, approvedReservation.id))

    await db.update(resources).set({ status: 'borrowed' }).where(eq(resources.id, resourceId))

    return NextResponse.json({ ok: true })
  }

  const issuedReservation = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'equipment'),
      eq(reservations.resourceId, resourceId),
      inArray(reservations.status, ['issued', 'active', 'upcoming'])
    ),
    orderBy: [desc(reservations.createdAt)],
  })

  if (!issuedReservation) {
    return NextResponse.json({ error: 'No issued reservation to close' }, { status: 409 })
  }

  await db
    .update(reservations)
    .set({
      status: 'completed',
      endAt: new Date(),
      pendingApproval: false,
    })
    .where(eq(reservations.id, issuedReservation.id))

  await db.update(resources).set({ status: 'available' }).where(eq(resources.id, resourceId))

  return NextResponse.json({ ok: true })
}
