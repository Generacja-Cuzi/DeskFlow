import { and, eq, inArray } from 'drizzle-orm'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { reservations, resources, userCompanyMemberships } from '@/lib/db/schema'
import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'

const equipmentCategories = ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories'] as const

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [usersRows, reservationsRows, resourcesRows] = await Promise.all([
    db.query.userCompanyMemberships.findMany({ where: eq(userCompanyMemberships.companyId, companyId) }),
    db.query.reservations.findMany({ where: eq(reservations.companyId, companyId) }),
    db.query.resources.findMany({
      where: and(eq(resources.companyId, companyId), inArray(resources.category, equipmentCategories)),
    }),
  ])

  const deskReservations = reservationsRows.filter((row) => row.type === 'desk').length
  const roomReservations = reservationsRows.filter((row) => row.type === 'room').length
  const equipmentReservations = reservationsRows.filter((row) => row.type === 'equipment').length
  const activeReservations = reservationsRows.filter((row) => ['active', 'upcoming', 'approved', 'issued', 'pending'].includes(row.status)).length
  const borrowedEquipment = resourcesRows.filter((row) => row.status === 'borrowed').length

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const titleSize = 18
  const textSize = 11
  let y = 800

  page.drawText('Raport administracyjny DeskFlow', {
    x: 40,
    y,
    size: titleSize,
    font: fontBold,
    color: rgb(0.09, 0.09, 0.11),
  })

  y -= 26
  page.drawText(`Data wygenerowania: ${new Date().toLocaleString('pl-PL')}`, {
    x: 40,
    y,
    size: textSize,
    font,
    color: rgb(0.25, 0.25, 0.3),
  })

  y -= 36
  page.drawText('Podsumowanie', {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.09, 0.09, 0.11),
  })

  y -= 24
  const lines = [
    `Uzytkownicy w firmie: ${usersRows.length}`,
    `Aktywne rezerwacje: ${activeReservations}`,
    `Rezerwacje biurek: ${deskReservations}`,
    `Rezerwacje sal: ${roomReservations}`,
    `Wnioski/rezerwacje sprzetu: ${equipmentReservations}`,
    `Sprzet wypozyczony teraz: ${borrowedEquipment}`,
    `Liczba zasobow sprzetowych: ${resourcesRows.length}`,
  ]

  for (const line of lines) {
    page.drawText(`- ${line}`, {
      x: 48,
      y,
      size: textSize,
      font,
      color: rgb(0.16, 0.16, 0.2),
    })
    y -= 18
  }

  y -= 18
  page.drawText('Ostatnie rezerwacje', {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.09, 0.09, 0.11),
  })

  y -= 22
  const latestReservations = [...reservationsRows]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12)

  for (const row of latestReservations) {
    if (y < 60) {
      break
    }

    page.drawText(
      `${row.type.toUpperCase()} | ${row.name} | ${row.status} | ${row.startAt.toLocaleString('pl-PL')}`,
      {
        x: 48,
        y,
        size: 10,
        font,
        color: rgb(0.16, 0.16, 0.2),
      }
    )
    y -= 16
  }

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="raport-admin-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
