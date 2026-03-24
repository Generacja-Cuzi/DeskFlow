import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, floorElements, reservations, resources, subscriptionPackages, userCompanyMemberships, users } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

function formatShortDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toPolishType(type: string) {
  if (type === 'equipment') return 'Sprzet'
  if (type === 'desk') return 'Biurko'
  if (type === 'room') return 'Sala'
  return type
}

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories'] as const
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

function formatChangePercent(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '0%'
  }

  const delta = ((current - previous) / previous) * 100
  const rounded = Math.round(delta)
  return `${rounded >= 0 ? '+' : ''}${rounded}%`
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

  const [membershipsRows, resourcesRows, reservationRows, desksRows, companyRow] = await Promise.all([
    db.query.userCompanyMemberships.findMany({
      where: eq(userCompanyMemberships.companyId, companyId),
      with: {
        user: true,
      },
    }),
    db.query.resources.findMany({
      where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
    }),
    db.query.reservations.findMany({ where: eq(reservations.companyId, companyId), with: { user: true } }),
    db.query.floorElements.findMany({
      where: inArray(floorElements.type, ['desk']),
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

  const usersRows = membershipsRows.map((membership) => ({
    id: membership.user?.id || membership.userId,
    name: membership.user?.name || 'Uzytkownik',
    email: membership.user?.email || '',
    department: membership.user?.department || null,
    role: membership.role,
    status: membership.status,
  }))

  const activeReservationsCount = reservationRows.filter((r) => r.status === 'active' || r.status === 'upcoming').length
  const availableDesksCount = companyDeskRows.filter((desk) => !occupiedDeskIds.has(desk.id)).length
  const desksCount = companyDeskRows.length
  const availableEquipmentCount = resourcesRows.filter((resource) => resource.status === 'available').length
  const usersLimit = packageRow?.maxUsers ?? usersRows.length
  const totalEquipmentCount = resourcesRows.length
  const borrowedEquipmentCount = resourcesRows.filter((r) => r.status === 'borrowed').length

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)

  const createdToday = reservationRows.filter((row) => row.createdAt >= todayStart && row.createdAt < tomorrowStart).length
  const createdYesterday = reservationRows.filter((row) => row.createdAt >= yesterdayStart && row.createdAt < todayStart).length
  const reservationsChange = formatChangePercent(createdToday, createdYesterday)

  const userCapacityPercent = usersLimit > 0 ? Math.round((usersRows.length / usersLimit) * 100) : 0
  const desksAvailablePercent = desksCount > 0 ? Math.round((availableDesksCount / desksCount) * 100) : 0
  const equipmentAvailablePercent = totalEquipmentCount > 0 ? Math.round((availableEquipmentCount / totalEquipmentCount) * 100) : 0

  const stats = [
    { name: 'Aktywne rezerwacje', value: String(activeReservationsCount), change: reservationsChange, icon: 'Calendar', color: 'text-primary' },
    { name: 'Uzytkownicy', value: `${usersRows.length}/${usersLimit}`, change: `${userCapacityPercent}% limitu`, icon: 'Users', color: 'text-accent' },
    { name: 'Dostepne biurka', value: `${availableDesksCount}/${desksCount}`, change: `${desksAvailablePercent}% wolne`, icon: 'Monitor', color: 'text-chart-3' },
    { name: 'Dostepny sprzet', value: `${availableEquipmentCount}/${totalEquipmentCount}`, change: `${equipmentAvailablePercent}% wolne`, icon: 'Package', color: 'text-chart-5' },
  ]

  const weekdays = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt']
  const usageData = weekdays.map((name, index) => ({
    name,
    biurka: Math.max(0, activeReservationsCount - index * 2),
    sale: Math.max(0, Math.floor(activeReservationsCount / 3) - index),
    sprzet: Math.max(0, borrowedEquipmentCount - index),
  }))

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const reservationsThisMonth = reservationRows.filter(
    (row) => row.createdAt >= monthStart && row.createdAt < tomorrow
  )

  const monthlyData = Array.from({ length: now.getDate() }, (_, index) => {
    const day = index + 1
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), day + 1)
    const cumulativeCount = reservationsThisMonth.filter((row) => row.createdAt < dayEnd).length

    return {
      name: String(day),
      rezerwacje: cumulativeCount,
    }
  })

  const equipmentWorkflowByResource = new Map<
    string,
    {
      status: string
      reservationId: string
      userName: string
      dueDate: string
      createdAt: Date
    }
  >()

  for (const reservation of reservationRows) {
    if (reservation.type !== 'equipment' || !reservation.resourceId) {
      continue
    }

    if (reservation.status === 'cancelled' || reservation.status === 'completed' || reservation.status === 'rejected') {
      continue
    }

    const existing = equipmentWorkflowByResource.get(reservation.resourceId)
    const userName = reservation.user?.name || 'Uzytkownik'
    if (!existing || existing.createdAt < reservation.createdAt) {
      equipmentWorkflowByResource.set(reservation.resourceId, {
        status: reservation.status,
        reservationId: reservation.id,
        userName,
        dueDate: reservation.endAt.toISOString().slice(0, 10),
        createdAt: reservation.createdAt,
      })
    }
  }

  const pendingRequests = reservationRows
    .filter((reservation) => reservation.type === 'equipment' && reservation.status === 'pending')
    .slice(0, 10)
    .map((reservation) => ({
      id: reservation.id,
      user: reservation.user?.name || 'Uzytkownik',
      type: toPolishType(reservation.type),
      item: reservation.name,
      date: formatShortDate(reservation.createdAt),
      status: reservation.status,
      purpose: reservation.meetingTitle || null,
    }))

  const resourcesWithWorkflow = resourcesRows.map((resource) => {
    const workflow = equipmentWorkflowByResource.get(resource.id)

    return {
      ...resource,
      workflowStatus: workflow?.status || null,
      workflowReservationId: workflow?.reservationId || null,
      workflowUser: workflow?.userName || null,
      workflowDueDate: workflow?.dueDate || null,
    }
  })

  return NextResponse.json({
    stats,
    usageData,
    monthlyData,
    pendingRequests,
    users: usersRows,
    resources: resourcesWithWorkflow,
  })
}
