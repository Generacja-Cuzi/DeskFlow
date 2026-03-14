import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, userCompanyMemberships, users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function GET(request: Request) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allCompanies = await db.query.companies.findMany({ orderBy: [asc(companies.name)] })

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') === 'application' ? 'application' : 'company'
  const companyIdFromQuery = url.searchParams.get('companyId')
  const selectedCompanyId = companyIdFromQuery || allCompanies[0]?.id || null

  if (scope === 'application') {
    const superadmins = await db.query.users.findMany({
      where: eq(users.role, 'superadmin'),
      orderBy: [asc(users.name)],
    })

    return NextResponse.json({
      scope,
      companies: allCompanies,
      selectedCompanyId,
      users: superadmins,
    })
  }

  const usersInCompany = selectedCompanyId
    ? await db.query.userCompanyMemberships.findMany({
      where: eq(userCompanyMemberships.companyId, selectedCompanyId),
      with: {
        user: true,
      },
      orderBy: [asc(userCompanyMemberships.createdAt)],
    })
    : []

  return NextResponse.json({
    scope,
    companies: allCompanies,
    selectedCompanyId,
    users: usersInCompany.map((membership) => ({
      id: membership.user?.id || membership.userId,
      name: membership.user?.name || 'Uzytkownik',
      email: membership.user?.email || '',
      department: membership.user?.department || null,
      role: membership.role,
      status: membership.status,
      companyId: membership.companyId,
    })),
  })
}

export async function POST(request: Request) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const scope = body.scope === 'application' ? 'application' : 'company'
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const department = typeof body.department === 'string' ? body.department.trim() : 'Management'

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (scope === 'application') {
    const existingByEmail = await db.query.users.findFirst({ where: eq(users.email, email) })

    if (existingByEmail) {
      await db
        .update(users)
        .set({
          name,
          department,
          role: 'superadmin',
          status: 'active',
          companyId: null,
        })
        .where(eq(users.id, existingByEmail.id))

      return NextResponse.json({ ok: true, id: existingByEmail.id, updated: true })
    }

    const id = `pending-${crypto.randomUUID()}`

    await db.insert(users).values({
      id,
      companyId: null,
      name,
      email,
      department,
      role: 'superadmin',
      status: 'active',
    })

    return NextResponse.json({ ok: true, id, updated: false })
  }

  const companyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''

  if (!companyId) {
    return NextResponse.json({ error: 'Missing companyId' }, { status: 400 })
  }

  const existingByEmail = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (existingByEmail) {
    await db
      .update(users)
      .set({
        name,
        department,
        status: 'active',
      })
      .where(eq(users.id, existingByEmail.id))

    await db
      .insert(userCompanyMemberships)
      .values({
        id: crypto.randomUUID(),
        userId: existingByEmail.id,
        companyId,
        role: 'user',
        status: 'active',
      })
      .onConflictDoUpdate({
        target: [userCompanyMemberships.userId, userCompanyMemberships.companyId],
        set: {
          role: 'user',
          status: 'active',
        },
      })

    return NextResponse.json({ ok: true, id: existingByEmail.id, updated: true })
  }

  const id = `pending-${crypto.randomUUID()}`

  await db.insert(users).values({
    id,
    companyId,
    name,
    email,
    department,
    role: 'user',
    status: 'active',
  })

  await db.insert(userCompanyMemberships).values({
    id: crypto.randomUUID(),
    userId: id,
    companyId,
    role: 'user',
    status: 'active',
  })

  return NextResponse.json({ ok: true, id, updated: false })
}
