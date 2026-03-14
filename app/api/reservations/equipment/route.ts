import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function POST(request: Request) {
  const body = await request.json()
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const resource = await db.query.resources.findFirst({
    where: and(eq(resources.id, body.resourceId), eq(resources.companyId, companyId)),
  })

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  await db
    .insert(reservations)
    .values({
      id: crypto.randomUUID(),
      companyId,
      userId: actor.user?.id || null,
      type: 'equipment',
      targetId: resource.id,
      resourceId: resource.id,
      name: resource.name,
      location: resource.location,
      startAt: new Date(body.startDate),
      endAt: new Date(body.endDate),
      date: new Date(body.startDate).toISOString().slice(0, 10),
      status: 'upcoming',
      pendingApproval: true,
    })

  await db.update(resources).set({ status: 'borrowed' }).where(eq(resources.id, resource.id))

  return NextResponse.json({ ok: true })
}
