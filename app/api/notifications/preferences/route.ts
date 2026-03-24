import { NextResponse } from 'next/server'

import { getActor, getActorMembershipForCompany } from '@/lib/server/auth'
import { getActiveCompanyId } from '@/lib/server/company'
import {
  getCompanyNotificationSettings,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/server/notifications'

export async function GET() {
  const actor = await getActor()
  const companyId = await getActiveCompanyId()

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const membership = await getActorMembershipForCompany(companyId)

  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const preferences = await getNotificationPreferences(actor.user.id, companyId)

  return NextResponse.json({
    preferences: {
      inAppEnabled: preferences.inAppEnabled,
      emailEnabled: preferences.emailEnabled,
      inAppReservationAlerts: preferences.inAppReservationAlerts,
      inAppRequestAlerts: preferences.inAppRequestAlerts,
      emailReservationAlerts: preferences.emailReservationAlerts,
      emailRequestAlerts: preferences.emailRequestAlerts,
      inAppDailySummary: preferences.inAppDailySummary,
      emailDailySummary: preferences.emailDailySummary,
      dailySummary: preferences.dailySummary,
    },
    isAdmin: preferences.isAdmin,
    lockedByAdmin: preferences.lockedByAdmin,
  })
}

export async function PATCH(request: Request) {
  const actor = await getActor()
  const companyId = await getActiveCompanyId()

  if (!actor.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }

  const membership = await getActorMembershipForCompany(companyId)

  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companySettings = await getCompanyNotificationSettings(companyId)
  const isAdmin = membership.role === 'admin' || membership.role === 'superadmin'

  if (companySettings.lockUserPreferences && !isAdmin) {
    return NextResponse.json({ error: 'Notification preferences are locked by admin' }, { status: 423 })
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
    dailySummary: typeof body.dailySummary === 'boolean' ? body.dailySummary : undefined,
  }

  const hasAnyPatch = Object.values(patch).some((value) => value !== undefined)

  if (!hasAnyPatch) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  let preferences

  try {
    preferences = await updateNotificationPreferences({
      userId: actor.user.id,
      companyId,
      patch,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to persist notification preferences' }, { status: 500 })
  }

  return NextResponse.json({
    preferences: {
      inAppEnabled: preferences.inAppEnabled,
      emailEnabled: preferences.emailEnabled,
      inAppReservationAlerts: preferences.inAppReservationAlerts,
      inAppRequestAlerts: preferences.inAppRequestAlerts,
      emailReservationAlerts: preferences.emailReservationAlerts,
      emailRequestAlerts: preferences.emailRequestAlerts,
      inAppDailySummary: preferences.inAppDailySummary,
      emailDailySummary: preferences.emailDailySummary,
      dailySummary: preferences.dailySummary,
    },
    isAdmin: preferences.isAdmin,
    lockedByAdmin: preferences.lockedByAdmin,
  })
}
