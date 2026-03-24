import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { userCompanyMemberships, users } from '@/lib/db/schema'
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
  const scope = body.scope === 'application' ? 'application' : 'company'

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

  if (scope === 'company') {
    const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId for company scope' }, { status: 400 })
    }

    const membership = await db.query.userCompanyMemberships.findFirst({
      where: and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)),
    })

    if (!membership && nextCompanyId === undefined && nextRole === undefined && nextStatus === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    await db
      .insert(userCompanyMemberships)
      .values({
        id: crypto.randomUUID(),
        userId,
        companyId,
        role: nextRole && nextRole !== 'superadmin' ? nextRole : 'user',
        status: nextStatus || 'active',
      })
      .onConflictDoUpdate({
        target: [userCompanyMemberships.userId, userCompanyMemberships.companyId],
        set: {
          role: nextRole && nextRole !== 'superadmin' ? nextRole : membership?.role || 'user',
          status: nextStatus || membership?.status || 'active',
        },
      })

    if (nextCompanyId !== undefined) {
      await db
        .insert(userCompanyMemberships)
        .values({
          id: crypto.randomUUID(),
          userId,
          companyId: nextCompanyId,
          role: 'user',
          status: 'active',
        })
        .onConflictDoNothing()
    }

    return NextResponse.json({ ok: true })
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

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await context.params
  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') === 'company' ? 'company' : 'application'
  const companyId = url.searchParams.get('companyId')?.trim() || ''

  if (scope === 'company') {
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId for company scope' }, { status: 400 })
    }

    await db
      .delete(userCompanyMemberships)
      .where(and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)))

    const remainingMembership = await db.query.userCompanyMemberships.findFirst({
      where: eq(userCompanyMemberships.userId, userId),
    })

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (targetUser) {
      await db
        .update(users)
        .set({
          companyId: remainingMembership?.companyId || null,
        })
        .where(eq(users.id, userId))
    }

    return NextResponse.json({ ok: true, removedFromCompany: true })
  }

  if (actor.user.id === userId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  await db.delete(userCompanyMemberships).where(eq(userCompanyMemberships.userId, userId))
  await db.delete(users).where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
