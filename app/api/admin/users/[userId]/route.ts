import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { userCompanyMemberships, users } from '@/lib/db/schema'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
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
  const body = await request.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const department = typeof body.department === 'string' ? body.department.trim() : ''
  const status = body.status === 'active' || body.status === 'inactive' ? body.status : null
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userInCompany = await db.query.userCompanyMemberships.findFirst({
    where: and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)),
  })

  if (!userInCompany) {
    return NextResponse.json({ error: 'User not found in company' }, { status: 404 })
  }

  const existingWithEmail = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existingWithEmail && existingWithEmail.id !== userId) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  await db
    .update(users)
    .set({
      name,
      email,
      department: department || null,
    })
    .where(eq(users.id, userId))

  if (status) {
    await db
      .update(userCompanyMemberships)
      .set({ status })
      .where(and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)))
  }

  return NextResponse.json({ ok: true })
}

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
