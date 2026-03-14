import { asc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, subscriptionPackages } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

const activeCompanyStatuses = ['active', 'trial']

export async function GET() {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [packages, companyRows] = await Promise.all([
    db.query.subscriptionPackages.findMany({ orderBy: [asc(subscriptionPackages.price)] }),
    db.query.companies.findMany({ where: inArray(companies.status, activeCompanyStatuses) }),
  ])

  const companiesByPlan = new Map<string, number>()
  for (const company of companyRows) {
    companiesByPlan.set(company.plan, (companiesByPlan.get(company.plan) || 0) + 1)
  }

  const rows = packages.map((pkg) => {
    const companiesCount = companiesByPlan.get(pkg.id) || 0
    const mrrContribution = pkg.price * companiesCount

    return {
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      maxUsers: pkg.maxUsers,
      maxResources: pkg.maxResources,
      active: pkg.active,
      companiesCount,
      mrrContribution,
    }
  })

  const totalMrr = rows.reduce((sum, row) => sum + row.mrrContribution, 0)

  return NextResponse.json({
    packages: rows,
    totalMrr,
  })
}
