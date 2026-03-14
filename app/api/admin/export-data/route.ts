import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companyBranding, reservations, resources, userCompanyMemberships, users } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories']

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [branding, memberships, equipmentRows, reservationRows] = await Promise.all([
    db.query.companyBranding.findFirst({ where: eq(companyBranding.companyId, companyId) }),
    db.query.userCompanyMemberships.findMany({
      where: eq(userCompanyMemberships.companyId, companyId),
      with: { user: true },
    }),
    db.query.resources.findMany({
      where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
    }),
    db.query.reservations.findMany({
      where: eq(reservations.companyId, companyId),
      with: { user: true },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
  ])

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    companyId,
    branding,
    users: memberships.map((membership) => ({
      id: membership.user?.id,
      name: membership.user?.name,
      email: membership.user?.email,
      department: membership.user?.department,
      role: membership.role,
      status: membership.status,
    })),
    equipment: equipmentRows,
    reservations: reservationRows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      name: row.name,
      location: row.location,
      date: row.date,
      startAt: row.startAt,
      endAt: row.endAt,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          }
        : null,
    })),
  })
}
