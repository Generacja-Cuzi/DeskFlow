import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, users } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories']

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
      where: and(eq(reservations.companyId, companyId), eq(reservations.type, 'equipment')),
      with: {
        user: true,
      },
    }),
  ])

  const activeBorrowByResource = new Map(
    activeBorrows
      .filter((reservation) => reservation.status !== 'cancelled')
      .map((reservation) => [reservation.resourceId, reservation])
  )

  return NextResponse.json(
    items.map((item) => {
      const reservation = activeBorrowByResource.get(item.id)
      const user = reservation?.user as typeof users.$inferSelect | undefined

      return {
        ...item,
        borrowedBy: user?.name || undefined,
        returnDate: reservation?.endAt ? reservation.endAt.toISOString().slice(0, 10) : undefined,
      }
    })
  )
}
