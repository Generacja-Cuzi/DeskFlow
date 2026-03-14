import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'
import { getActor, getActorMemberships } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function GET() {
  const actor = await getActor()

  if (!actor.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeCompanyId = await getActiveCompanyId()
  const memberships = await getActorMemberships()
  const isImpersonating = actor.user.role === 'superadmin' && !!activeCompanyId

  const company = activeCompanyId
    ? await db.query.companies.findFirst({ where: eq(companies.id, activeCompanyId) })
    : null

  return NextResponse.json({
    user: {
      id: actor.user.id,
      name: actor.user.name,
      email: actor.user.email,
      role: actor.user.role,
      companyId: actor.user.companyId,
      status: actor.user.status,
    },
    memberships,
    selectedCompanyId: activeCompanyId,
    impersonation: {
      active: isImpersonating,
      companyId: isImpersonating ? activeCompanyId : null,
      companyName: isImpersonating ? company?.name || null : null,
    },
  })
}
