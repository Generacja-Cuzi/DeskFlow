import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const actor = await getActor()

  if (!actor.user || (actor.user.role !== 'admin' && actor.user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const { userId } = await context.params
  const body = await request.json()
  const nextRole = body.role === 'admin' || body.role === 'user' ? body.role : null

  if (!nextRole) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const target = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.companyId, companyId)),
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found in your company' }, { status: 404 })
  }

  await db
    .update(users)
    .set({ role: nextRole })
    .where(and(eq(users.id, userId), eq(users.companyId, companyId)))

  return NextResponse.json({ ok: true })
}
