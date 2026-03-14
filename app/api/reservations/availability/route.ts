import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

const activeStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming'] as const

export async function GET(request: Request) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const date = url.searchParams.get('date')

  if (!date || (type !== 'desk' && type !== 'room')) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }

  const rows = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      eq(reservations.type, type),
      eq(reservations.date, date),
      inArray(reservations.status, activeStatuses)
    ),
    with: {
      user: true,
    },
  })

  const byTarget: Record<string, Array<{ startAt: string; endAt: string; userName: string | null; title: string | null }>> = {}

  for (const row of rows) {
    if (!byTarget[row.targetId]) {
      byTarget[row.targetId] = []
    }

    byTarget[row.targetId].push({
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      userName: row.user?.name || null,
      title: row.meetingTitle || null,
    })
  }

  return NextResponse.json({
    date,
    type,
    targets: byTarget,
  })
}
