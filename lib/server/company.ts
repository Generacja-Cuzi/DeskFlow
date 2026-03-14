import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

const ACTIVE_COMPANY_COOKIE = 'activeCompanyId'

export async function getActiveCompanyId() {
  const actor = await getActor()

  if (actor.user?.role === 'superadmin') {
    const cookieStore = await cookies()
    const selectedCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value || null

    if (selectedCompanyId) {
      return selectedCompanyId
    }

    return actor.user.companyId || null
  }

  if (actor.user) {
    return actor.user.companyId || null
  }

  if (actor.clerkUserId) {
    return null
  }

  const first = await db.query.companies.findFirst()
  return first?.id || null
}

export async function getCompanyById(companyId: string) {
  return db.query.companies.findFirst({ where: eq(companies.id, companyId) })
}

export const activeCompanyCookieName = ACTIVE_COMPANY_COOKIE
