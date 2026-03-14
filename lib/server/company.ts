import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'
import { getActor, getActorMemberships } from '@/lib/server/auth'

const ACTIVE_COMPANY_COOKIE = 'activeCompanyId'

export async function getActiveCompanyId() {
  const actor = await getActor()
  const cookieStore = await cookies()
  const selectedCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value || null

  if (actor.user?.role === 'superadmin') {
    if (selectedCompanyId) {
      return selectedCompanyId
    }

    return null
  }

  if (actor.user) {
    const memberships = await getActorMemberships()

    if (selectedCompanyId && memberships.some((membership) => membership.companyId === selectedCompanyId)) {
      return selectedCompanyId
    }

    if (memberships.length === 1) {
      return memberships[0].companyId
    }

    if (memberships.length > 1) {
      return null
    }

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
