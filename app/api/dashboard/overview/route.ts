import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, floorElements, reservations, resources, subscriptionPackages, userCompanyMemberships } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const reservationBlockingStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming']

function getCurrentHalfHourWindow() {
  const now = new Date()
  const start = new Date(now)
  start.setSeconds(0, 0)
  start.setMinutes(Math.floor(now.getMinutes() / 30) * 30)

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)

  return { start, end }
}

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA
}

export async function GET() {
  const actor = await getActor()

  if (!actor.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const [membershipsRows, resourcesRows, reservationRows, desksRows, companyRow] = await Promise.all([
    db.query.userCompanyMemberships.findMany({ where: eq(userCompanyMemberships.companyId, companyId) }),
    db.query.resources.findMany({ where: eq(resources.companyId, companyId) }),
    db.query.reservations.findMany({ where: eq(reservations.companyId, companyId) }),
    db.query.floorElements.findMany({
      where: eq(floorElements.type, 'desk'),
      with: {
        floor: true,
      },
    }),
    db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
  ])

  const packageRow = companyRow
    ? await db.query.subscriptionPackages.findFirst({ where: eq(subscriptionPackages.id, companyRow.plan) })
    : null

  const companyDeskRows = desksRows.filter((desk) => desk.floor.companyId === companyId)
  const { start: windowStart, end: windowEnd } = getCurrentHalfHourWindow()

  const deskReservationsInWindow = reservationRows.filter(
    (row) =>
      row.type === 'desk' &&
      reservationBlockingStatuses.includes(row.status) &&
      intervalsOverlap(row.startAt, row.endAt, windowStart, windowEnd)
  )

  const occupiedDeskIds = new Set(deskReservationsInWindow.map((row) => row.targetId))

  const activeReservationsCount = reservationRows.filter((r) => r.status === 'active' || r.status === 'upcoming').length
  const availableDesksCount = companyDeskRows.filter((desk) => !occupiedDeskIds.has(desk.id)).length
  const desksCount = companyDeskRows.length
  const availableEquipmentCount = resourcesRows.filter((r) => r.status === 'available').length
  const usersLimit = packageRow?.maxUsers ?? membershipsRows.length
  const totalEquipmentCount = resourcesRows.length
  const borrowedEquipmentCount = resourcesRows.filter((r) => r.status === 'borrowed').length

  return NextResponse.json({
    stats: {
      activeReservations: activeReservationsCount,
      users: membershipsRows.length,
      usersLimit,
      availableDesks: availableDesksCount,
      totalDesks: desksCount,
      availableEquipment: availableEquipmentCount,
      totalEquipment: totalEquipmentCount,
      borrowedEquipment: borrowedEquipmentCount,
    },
  })
}
