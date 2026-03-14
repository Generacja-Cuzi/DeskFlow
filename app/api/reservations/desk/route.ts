import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations } from '@/lib/db/schema'
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

  const desk = await db.query.floorElements.findFirst({ where: eq(floorElements.id, body.deskId) })

  if (!desk) {
    return NextResponse.json({ error: 'Desk not found' }, { status: 404 })
  }

  const date = typeof body.date === 'string' ? body.date : null
  const startAt = parseDateTime(date || '', body.startTime)
  const endAt = parseDateTime(date || '', body.endTime)

  if (!date || !startAt || !endAt || endAt <= startAt) {
    return NextResponse.json({ error: 'Invalid reservation time range' }, { status: 400 })
  }

  const sameDayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'desk'),
      eq(reservations.targetId, body.deskId),
      eq(reservations.date, date),
      inArray(reservations.status, blockingStatuses)
    ),
  })

  const hasConflict = sameDayReservations.some((row) =>
    intervalsOverlap(startAt, endAt, row.startAt, row.endAt)
  )

  if (hasConflict) {
    return NextResponse.json({ error: 'Desk is already reserved in selected time range' }, { status: 409 })
  }

  await db
    .insert(reservations)
    .values({
      id: crypto.randomUUID(),
      companyId,
      userId: actor.user?.id || null,
      type: 'desk',
      targetId: body.deskId,
      name: desk.name,
      location: `${desk.zone || 'Strefa'} , Pietro ${desk.floor}`,
      startAt,
      endAt,
      date,
      status: startAt <= new Date() && endAt >= new Date() ? 'active' : 'upcoming',
    })

  await db
    .update(floorElements)
    .set({
      status: 'reserved',
      reservedBy: body.userName || actor.user?.name || 'Uzytkownik',
      reservedUntil: endAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    })
    .where(and(eq(floorElements.id, body.deskId), eq(floorElements.type, 'desk')))

  return NextResponse.json({ ok: true })
}
