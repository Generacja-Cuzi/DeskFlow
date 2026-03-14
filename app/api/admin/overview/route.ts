import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

function formatShortDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET() {
  const actor = await getActor()

  if (!actor.user || (actor.user.role !== 'admin' && actor.user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const [usersRows, resourcesRows, reservationRows] = await Promise.all([
    db.query.users.findMany({ where: eq(users.companyId, companyId) }),
    db.query.resources.findMany({ where: eq(resources.companyId, companyId) }),
    db.query.reservations.findMany({ where: eq(reservations.companyId, companyId), with: { user: true } }),
  ])

  const activeReservationsCount = reservationRows.filter((r) => r.status === 'active' || r.status === 'upcoming').length
  const availableDesksCount = resourcesRows.filter((r) => r.type === 'Biurko' && r.status === 'available').length
  const desksCount = resourcesRows.filter((r) => r.type === 'Biurko').length
  const borrowedEquipmentCount = resourcesRows.filter((r) => r.status === 'borrowed').length

  const stats = [
    { name: 'Aktywne rezerwacje', value: String(activeReservationsCount), change: '+0%', icon: 'Calendar', color: 'text-primary' },
    { name: 'Uzytkownicy', value: String(usersRows.length), change: '+0%', icon: 'Users', color: 'text-accent' },
    { name: 'Dostepne biurka', value: `${availableDesksCount}/${desksCount || 1}`, change: '0%', icon: 'Monitor', color: 'text-chart-3' },
    { name: 'Wypozyczony sprzet', value: String(borrowedEquipmentCount), change: '0%', icon: 'Package', color: 'text-chart-5' },
  ]

  const weekdays = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt']
  const usageData = weekdays.map((name, index) => ({
    name,
    biurka: Math.max(0, activeReservationsCount - index * 2),
    sale: Math.max(0, Math.floor(activeReservationsCount / 3) - index),
    sprzet: Math.max(0, borrowedEquipmentCount - index),
  }))

  const monthlyData = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'].map((name, index) => ({
    name,
    rezerwacje: reservationRows.length + index * 5,
  }))

  const pendingRequests = reservationRows
    .filter((reservation) => reservation.pendingApproval && reservation.status !== 'cancelled')
    .slice(0, 5)
    .map((reservation) => ({
      id: reservation.id,
      user: reservation.user?.name || 'Uzytkownik',
      type: reservation.type === 'equipment' ? 'Sprzet' : reservation.type,
      item: reservation.name,
      date: formatShortDate(reservation.createdAt),
      status: 'pending',
    }))

  return NextResponse.json({
    stats,
    usageData,
    monthlyData,
    pendingRequests,
    users: usersRows,
    resources: resourcesRows,
  })
}
