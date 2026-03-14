import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

export async function GET(request: Request) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allCompanies = await db.query.companies.findMany({ orderBy: [asc(companies.name)] })

  const url = new URL(request.url)
  const companyIdFromQuery = url.searchParams.get('companyId')
  const selectedCompanyId = companyIdFromQuery || allCompanies[0]?.id || null

  const usersInCompany = selectedCompanyId
    ? await db.query.users.findMany({
        where: eq(users.companyId, selectedCompanyId),
        orderBy: [asc(users.name)],
      })
    : []

  return NextResponse.json({
    companies: allCompanies,
    selectedCompanyId,
    users: usersInCompany,
  })
}
