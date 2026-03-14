import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floors } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

export async function DELETE(_: Request, context: { params: Promise<{ floorId: string }> }) {
  const { floorId } = await context.params
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  await db.delete(floors).where(and(eq(floors.id, floorId), eq(floors.companyId, companyId)))

  return NextResponse.json({ ok: true })
}
