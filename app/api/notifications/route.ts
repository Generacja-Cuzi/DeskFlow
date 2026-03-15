import { and, desc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { notifications } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import { deleteNotificationsForUser, markAllNotificationsRead, markNotificationRead } from '@/lib/server/notifications'

export async function GET() {
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db.query.notifications.findMany({
    where: and(eq(notifications.companyId, companyId), eq(notifications.userId, actor.user.id)),
    orderBy: [desc(notifications.createdAt)],
    limit: 100,
  })

  const unreadCount = rows.filter((row) => !row.read).length

  return NextResponse.json({
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      timestamp: row.createdAt.toISOString(),
    })),
    unreadCount,
  })
}

export async function PATCH(request: Request) {
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const action = body?.action

  if (action === 'mark-all-read') {
    await markAllNotificationsRead(actor.user.id, companyId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'mark-read' && typeof body.id === 'string') {
    await markNotificationRead(body.id, actor.user.id, companyId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')

  if (!idParam) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  if (idParam === 'all-read') {
    const readIds = await db.query.notifications.findMany({
      where: and(eq(notifications.companyId, companyId), eq(notifications.userId, actor.user.id), eq(notifications.read, true)),
      columns: { id: true },
    })

    await deleteNotificationsForUser(readIds.map((row) => row.id), actor.user.id, companyId)
    return NextResponse.json({ ok: true })
  }

  const ids = idParam.split(',').map((item) => item.trim()).filter(Boolean)
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await db
    .delete(notifications)
    .where(and(eq(notifications.companyId, companyId), eq(notifications.userId, actor.user.id), inArray(notifications.id, ids)))

  return NextResponse.json({ ok: true })
}
