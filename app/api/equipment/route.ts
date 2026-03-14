import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, users } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories']
const workflowStatuses = ['pending', 'approved', 'issued', 'active', 'upcoming']

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const [items, activeBorrows] = await Promise.all([
    db.query.resources.findMany({
      where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
    }),
    db.query.reservations.findMany({
      where: and(
        eq(reservations.companyId, companyId),
        eq(reservations.type, 'equipment'),
        inArray(reservations.status, workflowStatuses)
      ),
      with: {
        user: true,
      },
    }),
  ])

  const activeBorrowByResource = new Map<string, (typeof activeBorrows)[number]>()
  for (const reservation of activeBorrows) {
    if (!reservation.resourceId) {
      continue
    }

    const existing = activeBorrowByResource.get(reservation.resourceId)
    if (!existing || existing.createdAt < reservation.createdAt) {
      activeBorrowByResource.set(reservation.resourceId, reservation)
    }
  }

  return NextResponse.json(
    items.map((item) => {
      const reservation = activeBorrowByResource.get(item.id)
      const user = reservation?.user as typeof users.$inferSelect | undefined

      const workflowStatus = reservation?.status || null

      return {
        ...item,
        workflowStatus,
        workflowReservationId: reservation?.id || null,
        requestedBy: user?.name || undefined,
        borrowedBy: user?.name || undefined,
        returnDate: reservation?.endAt ? reservation.endAt.toISOString().slice(0, 10) : undefined,
      }
    })
  )
}
