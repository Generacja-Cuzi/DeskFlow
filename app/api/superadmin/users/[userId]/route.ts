import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

const allowedRoles = new Set(['superadmin', 'admin', 'user'])
const allowedStatuses = new Set(['active', 'inactive'])

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await context.params
  const body = await request.json()

  const nextRole = typeof body.role === 'string' && allowedRoles.has(body.role) ? body.role : undefined
  const nextStatus =
    typeof body.status === 'string' && allowedStatuses.has(body.status) ? body.status : undefined
  const nextCompanyId =
    typeof body.companyId === 'string' ? (body.companyId.trim() || null) : undefined

  if (nextRole === undefined && nextStatus === undefined && nextCompanyId === undefined) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) })

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await db
    .update(users)
    .set({
      role: nextRole ?? target.role,
      status: nextStatus ?? target.status,
      companyId: nextCompanyId !== undefined ? nextCompanyId : target.companyId,
    })
    .where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
