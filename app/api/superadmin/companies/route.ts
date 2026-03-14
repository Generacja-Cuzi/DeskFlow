import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, companyBranding, subscriptionPackages, users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'

export async function GET() {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db.query.companies.findMany({
    with: {
      users: true,
      branding: true,
    },
  })

  const packages = await db.query.subscriptionPackages.findMany()
  const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]))

  return NextResponse.json(
    rows.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      users: company.users.length,
      plan: company.plan,
      maxUsers: packageById.get(company.plan)?.maxUsers || 0,
      status: company.status,
      primaryColor: company.branding?.primaryColor || '#3b82f6',
      secondaryColor: company.branding?.secondaryColor || '#10b981',
      createdAt: company.createdAt.toISOString().slice(0, 10),
    }))
  )
}

export async function POST(request: Request) {
  const actor = await getActor()

  if (!actor.user || actor.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const plan = typeof body.plan === 'string' ? body.plan : 'starter'
  const packageRow = await db.query.subscriptionPackages.findFirst({ where: eq(subscriptionPackages.id, plan) })

  if (!packageRow) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const id = crypto.randomUUID()

  await db.insert(companies).values({
    id,
    name: body.name,
    slug: body.slug,
    plan,
    status: 'trial',
  })

  await db.insert(companyBranding).values({
    companyId: id,
    name: body.name,
    primaryColor: body.primaryColor || '#3b82f6',
    secondaryColor: body.secondaryColor || '#10b981',
    textColor: '#111827',
    activeButtonTextColor: '#ffffff',
  })

  await db.insert(users).values({
    id: `owner-${id}`,
    companyId: id,
    name: `${body.name} Owner`,
    email: `${body.slug}@deskflow.local`,
    role: 'admin',
    status: 'active',
    department: 'Management',
  })

  return NextResponse.json({ ok: true, id })
}
