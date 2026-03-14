import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { activeCompanyCookieName } from '@/lib/server/company'

export async function POST(request: Request) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''

  if (!companyId) {
    return NextResponse.json({ error: 'Missing companyId' }, { status: 400 })
  }

  const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const cookieStore = await cookies()
  cookieStore.set(activeCompanyCookieName, companyId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  cookieStore.delete(activeCompanyCookieName)

  return NextResponse.json({ ok: true })
}
