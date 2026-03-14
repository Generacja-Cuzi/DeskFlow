import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'

export async function getActiveCompanyId() {
  const first = await db.query.companies.findFirst()
  return first?.id || 'company-techstart'
}

export async function getCompanyById(companyId: string) {
  return db.query.companies.findFirst({ where: eq(companies.id, companyId) })
}
