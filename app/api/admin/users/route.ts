import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function POST(request: Request) {
  const actor = await getActor()

  if (!actor.user || (actor.user.role !== 'admin' && actor.user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const department = typeof body.department === 'string' ? body.department.trim() : null

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existingByEmail = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (existingByEmail) {
    await db
      .update(users)
      .set({
        companyId,
        name,
        department,
        role: 'user',
        status: 'active',
      })
      .where(eq(users.id, existingByEmail.id))

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

  return NextResponse.json({ ok: true, id, updated: false })
}
