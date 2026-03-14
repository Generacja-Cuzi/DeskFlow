import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations } from '@/lib/db/schema'
import { getActor } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mine = url.searchParams.get('mine') === '1'
  const companyId = await getActiveCompanyId()
  const actor = await getActor()

  const rows = mine && actor.user
    ? await db.query.reservations.findMany({
        where: and(eq(reservations.companyId, companyId), eq(reservations.userId, actor.user.id)),
        orderBy: [desc(reservations.startAt)],
      })
    : await db.query.reservations.findMany({
        where: eq(reservations.companyId, companyId),
        orderBy: [desc(reservations.startAt)],
      })

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }))
  )
}
