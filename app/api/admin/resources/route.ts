import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories']

export async function POST(request: Request) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  if (!name || !location || !equipmentCategories.includes(category)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const typeByCategory: Record<string, string> = {
    laptops: 'Laptop',
    monitors: 'Monitor',
    projectors: 'Projektor',
    vehicles: 'Pojazd',
    accessories: 'Akcesorium',
  }

  const id = crypto.randomUUID()

  await db.insert(resources).values({
    id,
    companyId,
    name,
    type: typeByCategory[category] || 'Zasob',
    category,
    location,
    serialNumber: serialNumber || null,
    description: description || null,
    status: 'available',
  })

  return NextResponse.json({ ok: true, id })
}

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db.query.resources.findMany({
    where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
  })

  return NextResponse.json(rows)
}
