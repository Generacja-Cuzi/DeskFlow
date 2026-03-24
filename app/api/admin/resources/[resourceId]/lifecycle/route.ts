import { and, desc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources } from '@/lib/db/schema'
import { sendResourceIssuedEmail, sendResourceReturnedEmail } from '@/lib/server/notification-emails'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import { createNotification } from '@/lib/server/notifications'

export async function PATCH(request: Request, context: { params: Promise<{ resourceId: string }> }) {
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
  const action = body?.action

  if (action !== 'issue' && action !== 'return') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const resource = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.companyId, companyId)),
  })

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  if (action === 'issue') {
    const approvedReservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.companyId, companyId),
        eq(reservations.type, 'equipment'),
        eq(reservations.resourceId, resourceId),
        eq(reservations.status, 'approved')
      ),
      orderBy: [desc(reservations.createdAt)],
      with: {
        user: true,
      },
    })

    if (!approvedReservation) {
      return NextResponse.json({ error: 'No approved request to issue' }, { status: 409 })
    }

    await db
      .update(reservations)
      .set({
        status: 'issued',
        pendingApproval: false,
      })
      .where(eq(reservations.id, approvedReservation.id))

    await db.update(resources).set({ status: 'borrowed' }).where(eq(resources.id, resourceId))

    await sendResourceIssuedEmail({
      recipient: {
        email: approvedReservation.user?.email,
        name: approvedReservation.user?.name,
      },
      resourceName: resource.name,
      endAt: approvedReservation.endAt,
      companyId,
      userId: approvedReservation.userId || undefined,
    })

    if (approvedReservation.userId) {
      await createNotification({
        companyId,
        userId: approvedReservation.userId,
        type: 'equipment',
        title: 'Sprzet zostal wydany',
        message: `Administrator wydal Ci ${resource.name}. Termin zwrotu: ${approvedReservation.endAt.toISOString().slice(0, 10)}.`,
      })
    }

    return NextResponse.json({ ok: true })
  }

  const issuedReservation = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, 'equipment'),
      eq(reservations.resourceId, resourceId),
      inArray(reservations.status, ['issued', 'active', 'upcoming'])
    ),
    orderBy: [desc(reservations.createdAt)],
    with: {
      user: true,
    },
  })

  if (!issuedReservation) {
    return NextResponse.json({ error: 'No issued reservation to close' }, { status: 409 })
  }

  await db
    .update(reservations)
    .set({
      status: 'completed',
      endAt: new Date(),
      pendingApproval: false,
    })
    .where(eq(reservations.id, issuedReservation.id))

  await db.update(resources).set({ status: 'available' }).where(eq(resources.id, resourceId))

  await sendResourceReturnedEmail({
    recipient: {
      email: issuedReservation.user?.email,
      name: issuedReservation.user?.name,
    },
    resourceName: resource.name,
    companyId,
    userId: issuedReservation.userId || undefined,
  })

  if (issuedReservation.userId) {
    await createNotification({
      companyId,
      userId: issuedReservation.userId,
      type: 'equipment',
      title: 'Zwrot zakonczony',
      message: `Administrator oznaczyl zwrot zasobu ${resource.name}.`,
    })
  }

  return NextResponse.json({ ok: true })
}
