import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories']

const typeByCategory: Record<string, string> = {
  laptops: 'Laptop',
  monitors: 'Monitor',
  projectors: 'Projektor',
  vehicles: 'Pojazd',
  accessories: 'Akcesorium',
}

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

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const status = body.status === 'available' || body.status === 'borrowed' || body.status === 'maintenance' ? body.status : null

  if (!name || !location || !equipmentCategories.includes(category)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!existing) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  await db
    .update(resources)
    .set({
      name,
      location,
      category,
      type: typeByCategory[category] || existing.type,
      serialNumber: serialNumber || null,
      description: description || null,
      ...(status ? { status } : {}),
    })
    .where(and(eq(resources.id, resourceId), eq(resources.companyId, companyId)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ resourceId: string }> }) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { resourceId } = await context.params

  const existing = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!existing) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  await db.update(reservations).set({ resourceId: null }).where(eq(reservations.resourceId, resourceId))
  await db.delete(resources).where(and(eq(resources.id, resourceId), eq(resources.companyId, companyId)))

  return NextResponse.json({ ok: true })
}
