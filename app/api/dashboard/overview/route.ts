import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, userCompanyMemberships } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function GET() {
  const actor = await getActor()

  if (!actor.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const [membershipsRows, resourcesRows, reservationRows] = await Promise.all([
    db.query.userCompanyMemberships.findMany({ where: eq(userCompanyMemberships.companyId, companyId) }),
    db.query.resources.findMany({ where: eq(resources.companyId, companyId) }),
    db.query.reservations.findMany({ where: eq(reservations.companyId, companyId) }),
  ])

  const activeReservationsCount = reservationRows.filter((r) => r.status === 'active' || r.status === 'upcoming').length
  const availableDesksCount = resourcesRows.filter((r) => r.type === 'Biurko' && r.status === 'available').length
  const desksCount = resourcesRows.filter((r) => r.type === 'Biurko').length
  const borrowedEquipmentCount = resourcesRows.filter((r) => r.status === 'borrowed').length

  return NextResponse.json({
    stats: {
      activeReservations: activeReservationsCount,
      users: membershipsRows.length,
      availableDesks: availableDesksCount,
      totalDesks: desksCount,
      borrowedEquipment: borrowedEquipmentCount,
    },
  })
}
