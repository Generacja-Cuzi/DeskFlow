import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, companyBranding } from '@/lib/db/schema'
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
