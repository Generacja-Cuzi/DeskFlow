import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { userCompanyMemberships, users } from '@/lib/db/schema'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function DELETE(_: Request, context: { params: Promise<{ userId: string }> }) {
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

  const { userId } = await context.params

  if (actor.user.id === userId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  await db
    .delete(userCompanyMemberships)
    .where(and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)))

  const remainingMembership = await db.query.userCompanyMemberships.findFirst({ where: eq(userCompanyMemberships.userId, userId) })

  if (!remainingMembership) {
    await db.delete(users).where(eq(users.id, userId))
  }

  return NextResponse.json({ ok: true })
}
