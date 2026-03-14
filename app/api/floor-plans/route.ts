import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { floorElements, floors } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'
import { getFloorPlans } from '@/lib/server/floor-plans'

export async function GET() {
  const companyId = await getActiveCompanyId()
  const floorPlans = await getFloorPlans(companyId)
  return NextResponse.json(floorPlans)
}

export async function POST(request: Request) {
  const companyId = await getActiveCompanyId()
  const floorPlan = await request.json()

  await db.transaction(async (tx) => {
    const existing = await tx.query.floors.findFirst({ where: eq(floors.id, floorPlan.id) })

    if (!existing) {
      await tx.insert(floors).values({
        id: floorPlan.id,
        companyId,
        name: floorPlan.name,
        floorNumber: floorPlan.floorNumber,
        canvasWidth: floorPlan.canvasWidth || 1200,
        canvasHeight: floorPlan.canvasHeight || 800,
      })
    } else {
      await tx
        .update(floors)
        .set({
          name: floorPlan.name,
          floorNumber: floorPlan.floorNumber,
          canvasWidth: floorPlan.canvasWidth || 1200,
          canvasHeight: floorPlan.canvasHeight || 800,
          updatedAt: new Date(),
        })
        .where(and(eq(floors.id, floorPlan.id), eq(floors.companyId, companyId)))
    }

    await tx.delete(floorElements).where(eq(floorElements.floorId, floorPlan.id))

    if (Array.isArray(floorPlan.elements) && floorPlan.elements.length) {
      await tx.insert(floorElements).values(
        floorPlan.elements.map((element: any) => ({
          id: element.id,
          floorId: floorPlan.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation || 0,
          name: element.name,
          capacity: element.capacity ?? null,
          equipment: element.equipment || [],
          floor: element.floor ?? floorPlan.floorNumber,
          status: element.status || null,
          reservedBy: element.reservedBy || null,
          reservedUntil: element.reservedUntil || null,
          timeSlots: element.timeSlots || [],
          zone: element.zone || null,
          description: element.description || null,
          labelFontFamily: element.labelFontFamily || null,
          labelFontSize: element.labelFontSize ?? null,
          labelColor: element.labelColor || null,
          labelOffsetX: element.labelOffsetX ?? null,
          labelOffsetY: element.labelOffsetY ?? null,
        }))
      )
    }
  })

  return NextResponse.json({ ok: true })
}
