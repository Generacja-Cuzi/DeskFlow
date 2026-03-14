import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

type ReservationType = 'desk' | 'room'

function parseDateTime(value: string | null, fallback: string) {
  if (!value) {
    return new Date(fallback)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) {
    return new Date(fallback)
  }

  return parsed
}

export async function GET(request: Request) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const typeParam = url.searchParams.get('type')
  const fromDate = url.searchParams.get('fromDate')
  const toDate = url.searchParams.get('toDate')
  const fromTime = url.searchParams.get('fromTime')
  const toTime = url.searchParams.get('toTime')

  const types: ReservationType[] =
    typeParam === 'desk' || typeParam === 'room'
      ? [typeParam]
      : ['desk', 'room']

  const rows = await db.query.reservations.findMany({
    where: and(
      eq(reservations.companyId, companyId),
      inArray(reservations.type, types)
    ),
    with: {
      user: true,
    },
    orderBy: (table, { desc }) => [desc(table.startAt)],
  })

  const fromAt = parseDateTime(
    fromDate ? `${fromDate}T${fromTime || '00:00'}:00` : null,
    '1970-01-01T00:00:00.000Z'
  )
  const toAt = parseDateTime(
    toDate ? `${toDate}T${toTime || '23:59'}:59` : null,
    '2999-12-31T23:59:59.000Z'
  )

  const filtered = rows.filter((row) => row.startAt < toAt && row.endAt > fromAt)

  return NextResponse.json(
    filtered.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      location: row.location,
      date: row.date,
      status: row.status,
      meetingTitle: row.meetingTitle,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      userName: row.user?.name || 'Uzytkownik',
      userEmail: row.user?.email || '',
    }))
  )
}
