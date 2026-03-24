import { NextResponse } from 'next/server'

import { canManageCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import {
  applyCompanyNotificationSettingsToMembers,
  getCompanyNotificationSettings,
  updateCompanyNotificationSettings,
} from '@/lib/server/notifications'

export async function GET() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await getCompanyNotificationSettings(companyId)

  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const canManage = await canManageCompany(companyId)

  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const patch = {
    inAppEnabled: typeof body.inAppEnabled === 'boolean' ? body.inAppEnabled : undefined,
    emailEnabled: typeof body.emailEnabled === 'boolean' ? body.emailEnabled : undefined,
    inAppReservationAlerts:
      typeof body.inAppReservationAlerts === 'boolean' ? body.inAppReservationAlerts : undefined,
    inAppRequestAlerts: typeof body.inAppRequestAlerts === 'boolean' ? body.inAppRequestAlerts : undefined,
    emailReservationAlerts:
      typeof body.emailReservationAlerts === 'boolean' ? body.emailReservationAlerts : undefined,
    emailRequestAlerts: typeof body.emailRequestAlerts === 'boolean' ? body.emailRequestAlerts : undefined,
    inAppDailySummary: typeof body.inAppDailySummary === 'boolean' ? body.inAppDailySummary : undefined,
    emailDailySummary: typeof body.emailDailySummary === 'boolean' ? body.emailDailySummary : undefined,
    lockUserPreferences:
      typeof body.lockUserPreferences === 'boolean' ? body.lockUserPreferences : undefined,
  }

  const hasAnyPatch = Object.values(patch).some((value) => value !== undefined)

  if (!hasAnyPatch) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const settings = await updateCompanyNotificationSettings({ companyId, patch })

  if (settings.lockUserPreferences) {
    await applyCompanyNotificationSettingsToMembers(companyId)
  }

  return NextResponse.json({ settings })
}
