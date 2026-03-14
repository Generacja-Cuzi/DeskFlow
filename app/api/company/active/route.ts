import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { companies, companyBranding } from '@/lib/db/schema'
import { getActiveCompanyId } from '@/lib/server/company'

export async function GET() {
  const companyId = await getActiveCompanyId()

  const [company, branding] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
    db.query.companyBranding.findFirst({ where: eq(companyBranding.companyId, companyId) }),
  ])

  return NextResponse.json({
    company,
    branding,
  })
}

export async function PATCH(request: Request) {
  const companyId = await getActiveCompanyId()
  const body = await request.json()

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'DeskFlow'

  await db
    .insert(companyBranding)
    .values({
      companyId,
      name,
      logo: body.logo || null,
      primaryColor: body.primaryColor || '#3b82f6',
      secondaryColor: body.secondaryColor || '#10b981',
      textColor: body.textColor || '#111827',
      activeButtonTextColor: body.activeButtonTextColor || '#ffffff',
      description: body.description || null,
      website: body.website || null,
      address: body.address || null,
      phone: body.phone || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: companyBranding.companyId,
      set: {
        name,
        logo: body.logo || null,
        primaryColor: body.primaryColor || '#3b82f6',
        secondaryColor: body.secondaryColor || '#10b981',
        textColor: body.textColor || '#111827',
        activeButtonTextColor: body.activeButtonTextColor || '#ffffff',
        description: body.description || null,
        website: body.website || null,
        address: body.address || null,
        phone: body.phone || null,
        updatedAt: new Date(),
      },
    })

  if (body.companyName && typeof body.companyName === 'string') {
    await db.update(companies).set({ name: body.companyName.trim() }).where(eq(companies.id, companyId))
  }

  return NextResponse.json({ ok: true })
}
