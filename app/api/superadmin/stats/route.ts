import { and, count, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, reservations, users } from '@/lib/db/schema'

export async function GET() {
  const [allCompanies, allUsers, allReservations] = await Promise.all([
    db.select({ value: count() }).from(companies),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(reservations),
  ])

  const activeCompanies = await db.select({ value: count() }).from(companies).where(eq(companies.status, 'active'))
  const today = new Date().toISOString().slice(0, 10)
  const todaysReservations = await db
    .select({ value: count() })
    .from(reservations)
    .where(and(eq(reservations.status, 'active'), eq(reservations.date, today)))

  const recent = await db.query.companies.findMany({
    with: { users: true },
    limit: 6,
  })

  return NextResponse.json({
    stats: [
      {
        name: 'Aktywne firmy',
        value: String(activeCompanies[0]?.value || 0),
        change: `Lacznie: ${allCompanies[0]?.value || 0}`,
      },
      {
        name: 'Laczna liczba uzytkownikow',
        value: String(allUsers[0]?.value || 0),
        change: 'Dane na zywo',
      },
      {
        name: 'Rezerwacje dzis',
        value: String(todaysReservations[0]?.value || 0),
        change: `Wszystkie: ${allReservations[0]?.value || 0}`,
      },
      {
        name: 'MRR',
        value: `${(activeCompanies[0]?.value || 0) * 1990} PLN`,
        change: 'Szacunek',
      },
    ],
    recentCompanies: recent.map((company) => ({
      id: company.id,
      name: company.name,
      users: company.users.length,
      plan: company.plan,
      status: company.status,
      joinedAt: company.createdAt.toISOString().slice(0, 10),
    })),
  })
}
