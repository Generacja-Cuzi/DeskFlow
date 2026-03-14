import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const blockingStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming']

function parseDateTime(date: string, value?: string) {
  if (!value) {
    return null
  }

  if (value.includes('T')) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.valueOf()) ? null : parsed
  }

  const parsed = new Date(`${date}T${value}:00`)
  return Number.isNaN(parsed.valueOf()) ? null : parsed
}

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA
}

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

  const date = typeof body.date === 'string'
    ? body.date
    : typeof body.startDate === 'string'
      ? new Date(body.startDate).toISOString().slice(0, 10)
      : null

  const startAt = parseDateTime(date || '', body.startDate || body.startTime)
  const endAt = parseDateTime(date || '', body.endDate || body.endTime)

  if (!date || !startAt || !endAt || endAt <= startAt) {
    return NextResponse.json({ error: 'Invalid reservation time range' }, { status: 400 })
  }

  const equipmentReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'equipment'),
      eq(reservations.resourceId, resource.id),
      inArray(reservations.status, blockingStatuses)
    ),
  })

  const hasConflict = equipmentReservations.some((row) =>
    intervalsOverlap(startAt, endAt, row.startAt, row.endAt)
  )

  if (hasConflict) {
    return NextResponse.json({ error: 'Resource is already requested in selected time range' }, { status: 409 })
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
      startAt,
      endAt,
      date,
      meetingTitle: body.purpose || null,
      status: 'pending',
      pendingApproval: true,
    })

  return NextResponse.json({ ok: true })
}
