import { and, count, eq, gte, inArray, lt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, reservations, subscriptionPackages, userCompanyMemberships } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

export async function GET() {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [allCompanies, allReservations, membershipRows] = await Promise.all([
    db.select({ value: count() }).from(companies),
    db.select({ value: count() }).from(reservations),
    db.query.userCompanyMemberships.findMany(),
  ])

  const activeCompanies = await db.select({ value: count() }).from(companies).where(eq(companies.status, 'active'))
  const allCompanyRows = await db.query.companies.findMany()
  const activeOrTrialCompanies = allCompanyRows.filter((company) => company.status === 'active' || company.status === 'trial')
  const packages = await db.query.subscriptionPackages.findMany()

  const priceByPlan = new Map(packages.map((pkg) => [pkg.id, pkg.price]))
  const computedMrr = activeOrTrialCompanies.reduce((sum, company) => sum + (priceByPlan.get(company.plan) || 0), 0)

  const usersByCompanyId = new Map<string, number>()
  const uniqueUserIds = new Set<string>()

  for (const membership of membershipRows) {
    usersByCompanyId.set(membership.companyId, (usersByCompanyId.get(membership.companyId) || 0) + 1)
    uniqueUserIds.add(membership.userId)
  }

  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const todaysReservations = await db
    .select({ value: count() })
    .from(reservations)
    .where(
      and(
        gte(reservations.startAt, dayStart),
        lt(reservations.startAt, dayEnd),
        inArray(reservations.status, ['pending', 'approved', 'issued', 'active', 'upcoming'])
      )
    )

  const recent = await db.query.companies.findMany({ limit: 6 })

  return NextResponse.json({
    stats: [
      {
        name: 'Aktywne firmy',
        value: String(activeCompanies[0]?.value || 0),
        change: `Lacznie: ${allCompanies[0]?.value || 0}`,
      },
      {
        name: 'Laczna liczba uzytkownikow',
        value: String(uniqueUserIds.size),
        change: 'Dane na zywo',
      },
      {
        name: 'Rezerwacje dzis',
        value: String(todaysReservations[0]?.value || 0),
        change: `Wszystkie: ${allReservations[0]?.value || 0}`,
      },
      {
        name: 'MRR',
        value: `${computedMrr} PLN`,
        change: 'Suma pakietow aktywnych firm',
      },
    ],
    recentCompanies: recent.map((company) => ({
      id: company.id,
      name: company.name,
      users: usersByCompanyId.get(company.id) || 0,
      plan: company.plan,
      status: company.status,
      joinedAt: company.createdAt.toISOString().slice(0, 10),
    })),
  })
}
