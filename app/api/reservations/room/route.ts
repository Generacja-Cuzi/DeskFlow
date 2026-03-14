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

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const room = await db.query.floorElements.findFirst({ where: eq(floorElements.id, body.roomId) })

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const date = typeof body.date === 'string' ? body.date : null

  let startAt = parseDateTime(date || '', body.startTime)
  let endAt = parseDateTime(date || '', body.endTime)

  if ((!startAt || !endAt) && typeof body.timeSlot === 'string') {
    const [startRaw, endRaw] = body.timeSlot.split(' - ')
    startAt = parseDateTime(date || '', startRaw)
    endAt = parseDateTime(date || '', endRaw)
  }

  if (!date || !startAt || !endAt || endAt <= startAt) {
    return NextResponse.json({ error: 'Invalid reservation time range' }, { status: 400 })
  }

  const sameDayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'room'),
      eq(reservations.targetId, body.roomId),
      eq(reservations.date, date),
      inArray(reservations.status, blockingStatuses)
    ),
  })

  const hasConflict = sameDayReservations.some((row) =>
    intervalsOverlap(startAt, endAt, row.startAt, row.endAt)
  )

  if (hasConflict) {
    return NextResponse.json({ error: 'Room is already reserved in selected time range' }, { status: 409 })
  }

  const userSameDayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'room'),
      eq(reservations.userId, actor.user.id),
      eq(reservations.date, date),
      inArray(reservations.status, blockingStatuses)
    ),
  })

  const hasUserOverlap = userSameDayReservations.some((row) => intervalsOverlap(startAt, endAt, row.startAt, row.endAt))

  if (hasUserOverlap) {
    return NextResponse.json({ error: 'Masz juz rezerwacje sali w tym przedziale czasu' }, { status: 409 })
  }

  const startLabel = startAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const endLabel = endAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const timeSlot = `${startLabel} - ${endLabel}`

  await db
    .insert(reservations)
    .values({
      id: crypto.randomUUID(),
      companyId,
      userId: actor.user.id,
      type: 'room',
      targetId: body.roomId,
      name: room.name,
      location: `Pietro ${room.floor}`,
      startAt,
      endAt,
      date,
      timeSlot,
      meetingTitle: body.meetingTitle || null,
      participantCount: body.participantCount || null,
      status: 'upcoming',
    })

  await db
    .update(floorElements)
    .set({
      status: 'reserved',
    })
    .where(and(eq(floorElements.id, body.roomId), eq(floorElements.type, 'room')))

  return NextResponse.json({ ok: true })
}
