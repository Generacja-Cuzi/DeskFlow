import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

function toLocalHourMinute(value: string) {
  const date = new Date(value)
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

export async function POST(request: Request) {
  const body = await request.json()
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  const desk = await db.query.floorElements.findFirst({ where: eq(floorElements.id, body.deskId) })

  if (!desk) {
    return NextResponse.json({ error: 'Desk not found' }, { status: 404 })
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
      startAt: new Date(body.startTime),
      endAt: new Date(body.endTime),
      date: body.date,
      status: 'active',
    })

  await db
    .update(floorElements)
    .set({
      status: 'reserved',
      reservedBy: body.userName || actor.user?.name || 'Uzytkownik',
      reservedUntil: toLocalHourMinute(body.endTime),
    })
    .where(and(eq(floorElements.id, body.deskId), eq(floorElements.type, 'desk')))

  return NextResponse.json({ ok: true })
}
