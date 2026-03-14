import { asc, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { floorElements, floors } from '@/lib/db/schema'

export async function getFloorPlans(companyId: string) {
  const floorRows = await db.query.floors.findMany({
    where: eq(floors.companyId, companyId),
    orderBy: [asc(floors.floorNumber)],
  })

  if (!floorRows.length) {
    return []
  }

  const floorIds = floorRows.map((row) => row.id)
  const elementRows = await db.query.floorElements.findMany({
    where: inArray(floorElements.floorId, floorIds),
  })

  return floorRows.map((floor) => ({
    id: floor.id,
    name: floor.name,
    floorNumber: floor.floorNumber,
    canvasWidth: floor.canvasWidth,
    canvasHeight: floor.canvasHeight,
    elements: elementRows
      .filter((element) => element.floorId === floor.id)
      .map((element) => ({
        id: element.id,
        type: element.type,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        name: element.name,
        capacity: element.capacity || undefined,
        equipment: element.equipment || [],
        floor: element.floor,
        status: element.status || undefined,
        reservedBy: element.reservedBy || undefined,
        reservedUntil: element.reservedUntil || undefined,
        timeSlots: element.timeSlots || undefined,
        zone: element.zone || undefined,
        description: element.description || undefined,
        labelFontFamily: element.labelFontFamily || undefined,
        labelFontSize: element.labelFontSize || undefined,
        labelColor: element.labelColor || undefined,
        labelOffsetX: element.labelOffsetX || undefined,
        labelOffsetY: element.labelOffsetY || undefined,
      })),
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  }))
}
