import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getActor, getActorMemberships } from '@/lib/server/auth'
import { activeCompanyCookieName } from '@/lib/server/company'

export async function POST(request: Request) {
  const actor = await getActor()

  if (!actor.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''

  if (!companyId) {
    return NextResponse.json({ error: 'Missing companyId' }, { status: 400 })
  }

  if (actor.user.role === 'superadmin') {
    return NextResponse.json({ error: 'Use superadmin impersonation endpoint' }, { status: 400 })
  }

  const memberships = await getActorMemberships()
  const hasAccess = memberships.some((membership) => membership.companyId === companyId)

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  cookieStore.set(activeCompanyCookieName, companyId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(activeCompanyCookieName)
  return NextResponse.json({ ok: true })
}
