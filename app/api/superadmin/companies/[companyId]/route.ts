import { eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, companyBranding, userCompanyMemberships, users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

export async function PATCH(request: Request, context: { params: Promise<{ companyId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await context.params
  const body = await request.json()

  await db
    .update(companies)
    .set({
      name: body.name,
      slug: body.slug,
      plan: body.plan,
      status: body.status,
    })
    .where(eq(companies.id, companyId))

  if (body.status === 'suspended') {
    const memberships = await db.query.userCompanyMemberships.findMany({ where: eq(userCompanyMemberships.companyId, companyId) })

    await db
      .update(userCompanyMemberships)
      .set({ status: 'inactive' })
      .where(eq(userCompanyMemberships.companyId, companyId))

    if (memberships.length) {
      const uniqueUserIds = [...new Set(memberships.map((membership) => membership.userId))]

      await db
        .update(users)
        .set({ status: 'inactive' })
        .where(inArray(users.id, uniqueUserIds))
    }
  }

  if (body.status === 'active' || body.status === 'trial') {
    const memberships = await db.query.userCompanyMemberships.findMany({ where: eq(userCompanyMemberships.companyId, companyId) })

    await db
      .update(userCompanyMemberships)
      .set({ status: 'active' })
      .where(eq(userCompanyMemberships.companyId, companyId))

    if (memberships.length) {
      const uniqueUserIds = [...new Set(memberships.map((membership) => membership.userId))]

      await db
        .update(users)
        .set({ status: 'active' })
        .where(inArray(users.id, uniqueUserIds))
    }
  }

  await db
    .insert(companyBranding)
    .values({
      companyId,
      name: body.name,
      primaryColor: body.primaryColor || '#3b82f6',
      secondaryColor: body.secondaryColor || '#10b981',
      textColor: '#111827',
      activeButtonTextColor: '#ffffff',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: companyBranding.companyId,
      set: {
        name: body.name,
        primaryColor: body.primaryColor || '#3b82f6',
        secondaryColor: body.secondaryColor || '#10b981',
        updatedAt: new Date(),
      },
    })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ companyId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await context.params
  await db.delete(companies).where(eq(companies.id, companyId))
  return NextResponse.json({ ok: true })
}
