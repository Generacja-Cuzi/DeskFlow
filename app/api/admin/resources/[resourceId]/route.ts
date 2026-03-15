import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { sendResourceChangedEmail, sendReservationCancelledEmail } from '@/lib/server/notification-emails'
import { canManageCompany, getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import { createNotification } from '@/lib/server/notifications'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories'] as const

const typeByCategory: Record<string, string> = {
  laptops: 'Laptop',
  monitors: 'Monitor',
  projectors: 'Projektor',
  vehicles: 'Pojazd',
  accessories: 'Akcesorium',
}

export async function PATCH(request: Request, context: { params: Promise<{ resourceId: string }> }) {
  const actor = await getActor()
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { resourceId } = await context.params
  const body = await request.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const status = body.status === 'available' || body.status === 'borrowed' || body.status === 'maintenance' ? body.status : null

  if (!name || !location || !(equipmentCategories as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!existing) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  await db
    .update(resources)
    .set({
      name,
      location,
      category,
      type: typeByCategory[category] || existing.type,
      serialNumber: serialNumber || null,
      description: description || null,
      ...(status ? { status } : {}),
    })
    .where(and(eq(resources.id, resourceId), eq(resources.companyId, companyId)))

  const changes: string[] = []
  if (existing.name !== name) changes.push(`nazwa: ${existing.name} -> ${name}`)
  if (existing.location !== location) changes.push(`lokalizacja: ${existing.location} -> ${location}`)
  if ((existing.category || '') !== category) changes.push(`kategoria: ${existing.category || '-'} -> ${category}`)
  if ((existing.serialNumber || '') !== (serialNumber || '')) {
    changes.push(`numer seryjny: ${existing.serialNumber || '-'} -> ${serialNumber || '-'}`)
  }
  if ((existing.description || '') !== (description || '')) {
    changes.push(`opis: ${existing.description || '-'} -> ${description || '-'}`)
  }
  if (status && existing.status !== status) {
    changes.push(`status: ${existing.status} -> ${status}`)
  }

  if (changes.length > 0) {
    const activeReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.companyId, companyId),
        eq(reservations.type, 'equipment'),
        eq(reservations.resourceId, resourceId),
        eq(reservations.status, 'issued')
      ),
      with: {
        user: true,
      },
    })

    if (activeReservation?.user?.email) {
      await sendResourceChangedEmail({
        recipient: {
          email: activeReservation.user.email,
          name: activeReservation.user.name,
        },
        resourceName: name,
        changedBy: actor.user?.name || 'Administrator',
        changeDescription: changes.join('; '),
      })
    }

    if (activeReservation?.userId) {
      await createNotification({
        companyId,
        userId: activeReservation.userId,
        type: 'equipment',
        title: 'Aktualizacja wypozyczonego zasobu',
        message: `Administrator zaktualizowal dane zasobu ${name}.`,
      })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ resourceId: string }> }) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { resourceId } = await context.params

  const existing = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!existing) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  const linkedReservations = await db.query.reservations.findMany({
    where: and(eq(reservations.companyId, companyId), eq(reservations.resourceId, resourceId)),
    with: {
      user: true,
    },
  })

  await db.update(reservations).set({ resourceId: null, status: 'cancelled' }).where(eq(reservations.resourceId, resourceId))
  await db.delete(resources).where(and(eq(resources.id, resourceId), eq(resources.companyId, companyId)))

  await Promise.allSettled(
    linkedReservations.map((reservation) =>
      sendReservationCancelledEmail({
        recipient: {
          email: reservation.user?.email,
          name: reservation.user?.name,
        },
        reservationLabel: reservation.name,
        reason: `Zasob ${existing.name} zostal usuniety przez administratora.`,
      })
    )
  )

  await Promise.allSettled(
    linkedReservations
      .filter((reservation) => Boolean(reservation.userId))
      .map((reservation) =>
        createNotification({
          companyId,
          userId: reservation.userId!,
          type: 'rejection',
          title: 'Rezerwacja anulowana',
          message: `Twoja rezerwacja ${reservation.name} zostala anulowana, bo zasob ${existing.name} zostal usuniety.`,
        })
      )
  )

  return NextResponse.json({ ok: true })
}
