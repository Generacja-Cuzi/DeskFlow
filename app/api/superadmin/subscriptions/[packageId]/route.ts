import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, subscriptionPackages } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

export async function PATCH(request: Request, context: { params: Promise<{ packageId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { packageId } = await context.params
  const body = await request.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const price = Number(body.price)
  const maxUsers = Number(body.maxUsers)
  const maxResources = Number(body.maxResources)
  const active = typeof body.active === 'boolean' ? body.active : true

  if (!name || Number.isNaN(price) || Number.isNaN(maxUsers) || Number.isNaN(maxResources) || price < 0 || maxUsers < 1 || maxResources < 1) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const existing = await db.query.subscriptionPackages.findFirst({ where: eq(subscriptionPackages.id, packageId) })

  if (!existing) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  await db
    .update(subscriptionPackages)
    .set({
      name,
      price: Math.floor(price),
      maxUsers: Math.floor(maxUsers),
      maxResources: Math.floor(maxResources),
      active,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionPackages.id, packageId))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ packageId: string }> }) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { packageId } = await context.params

  const linkedCompany = await db.query.companies.findFirst({ where: eq(companies.plan, packageId as 'starter' | 'growth' | 'enterprise') })

  if (linkedCompany) {
    return NextResponse.json({ error: 'Cannot delete package assigned to companies' }, { status: 409 })
  }

  await db.delete(subscriptionPackages).where(eq(subscriptionPackages.id, packageId))

  return NextResponse.json({ ok: true })
}
