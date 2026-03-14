import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, reservations } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function POST(request: Request) {
  const body = await request.json()
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  const room = await db.query.floorElements.findFirst({ where: eq(floorElements.id, body.roomId) })

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const timeSlots = Array.isArray(room.timeSlots) ? room.timeSlots : []
  const updatedSlots = timeSlots.map((slot: any) => {
    if (slot.time !== body.timeSlot) {
      return slot
    }

    return {
      ...slot,
      available: false,
      bookedBy: body.userName || actor.user?.name || 'Uzytkownik',
      meetingTitle: body.meetingTitle || null,
    }
  })

  await db
    .insert(reservations)
    .values({
      id: crypto.randomUUID(),
      companyId,
      userId: actor.user?.id || null,
      type: 'room',
      targetId: body.roomId,
      name: room.name,
      location: `Pietro ${room.floor}`,
      startAt: new Date(`${body.date}T${body.timeSlot.split(' - ')[0]}:00.000Z`),
      endAt: new Date(`${body.date}T${body.timeSlot.split(' - ')[1]}:00.000Z`),
      date: body.date,
      timeSlot: body.timeSlot,
      meetingTitle: body.meetingTitle || null,
      participantCount: body.participantCount || null,
      status: 'upcoming',
    })

  await db
    .update(floorElements)
    .set({
      timeSlots: updatedSlots,
    })
    .where(and(eq(floorElements.id, body.roomId), eq(floorElements.type, 'room')))

  return NextResponse.json({ ok: true })
}
