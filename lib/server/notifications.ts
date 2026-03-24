import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import {
  companyNotificationSettings,
  notifications,
  userCompanyMemberships,
  userNotificationPreferences,
  users,
} from '@/lib/db/schema'

export type NotificationType = 'reservation' | 'equipment' | 'reminder' | 'approval' | 'rejection' | 'info'
type NotificationRole = 'superadmin' | 'admin' | 'user'

export type NotificationPreferences = {
  inAppEnabled: boolean
  emailEnabled: boolean
  inAppReservationAlerts: boolean
  inAppRequestAlerts: boolean
  emailReservationAlerts: boolean
  emailRequestAlerts: boolean
  inAppDailySummary: boolean
  emailDailySummary: boolean
  dailySummary: boolean
  lockedByAdmin: boolean
  isAdmin: boolean
}

type CompanyNotificationDefaults = {
  inAppEnabled: boolean
  emailEnabled: boolean
  inAppReservationAlerts: boolean
  inAppRequestAlerts: boolean
  emailReservationAlerts: boolean
  emailRequestAlerts: boolean
  inAppDailySummary: boolean
  emailDailySummary: boolean
  lockUserPreferences: boolean
}

const defaultCompanyNotificationSettings: CompanyNotificationDefaults = {
  inAppEnabled: true,
  emailEnabled: true,
  inAppReservationAlerts: true,
  inAppRequestAlerts: true,
  emailReservationAlerts: true,
  emailRequestAlerts: true,
  inAppDailySummary: false,
  emailDailySummary: false,
  lockUserPreferences: false,
}

type UserNotificationPreferencesPatch = Partial<{
  inAppEnabled: boolean
  emailEnabled: boolean
  inAppReservationAlerts: boolean
  inAppRequestAlerts: boolean
  emailReservationAlerts: boolean
  emailRequestAlerts: boolean
  inAppDailySummary: boolean
  emailDailySummary: boolean
  dailySummary: boolean
}>

type CreateNotificationInput = {
  companyId: string
  userId: string
  type: NotificationType
  title: string
  message: string
}

function isAdminRole(role: string | undefined): role is 'superadmin' | 'admin' {
  return role === 'superadmin' || role === 'admin'
}

function resolveNotificationGroup(type: NotificationType) {
  if (type === 'approval' || type === 'rejection') {
    return 'request' as const
  }

  return 'reservation' as const
}

function isTypeEnabledForInApp(type: NotificationType, preferences: NotificationPreferences) {
  if (!preferences.inAppEnabled) {
    return false
  }

  const group = resolveNotificationGroup(type)
  return group === 'request' ? preferences.inAppRequestAlerts : preferences.inAppReservationAlerts
}

function isTypeEnabledForEmail(type: NotificationType, preferences: NotificationPreferences) {
  if (!preferences.emailEnabled) {
    return false
  }

  const group = resolveNotificationGroup(type)
  return group === 'request' ? preferences.emailRequestAlerts : preferences.emailReservationAlerts
}

function buildPreferencesFromCompanyDefaults(
  role: NotificationRole,
  companyDefaults: CompanyNotificationDefaults
): NotificationPreferences {
  const isAdmin = isAdminRole(role)
  const inAppDailySummary = isAdmin ? companyDefaults.inAppDailySummary : false
  const emailDailySummary = isAdmin ? companyDefaults.emailDailySummary : false

  return {
    inAppEnabled: companyDefaults.inAppEnabled,
    emailEnabled: companyDefaults.emailEnabled,
    inAppReservationAlerts: companyDefaults.inAppReservationAlerts,
    inAppRequestAlerts: companyDefaults.inAppRequestAlerts,
    emailReservationAlerts: companyDefaults.emailReservationAlerts,
    emailRequestAlerts: companyDefaults.emailRequestAlerts,
    inAppDailySummary,
    emailDailySummary,
    dailySummary: inAppDailySummary || emailDailySummary,
    lockedByAdmin: companyDefaults.lockUserPreferences,
    isAdmin,
  }
}

export async function getCompanyNotificationSettings(companyId: string) {
  try {
    const row = await db.query.companyNotificationSettings.findFirst({
      where: eq(companyNotificationSettings.companyId, companyId),
    })

    if (!row) {
      return defaultCompanyNotificationSettings
    }

    return {
      inAppEnabled: row.inAppEnabled,
      emailEnabled: row.emailEnabled,
      inAppReservationAlerts: row.inAppReservationAlerts ?? row.reservationAlerts,
      inAppRequestAlerts: row.inAppRequestAlerts ?? row.requestAlerts,
      emailReservationAlerts: row.emailReservationAlerts ?? row.reservationAlerts,
      emailRequestAlerts: row.emailRequestAlerts ?? row.requestAlerts,
      inAppDailySummary: row.inAppDailySummary ?? row.dailySummary,
      emailDailySummary: row.emailDailySummary ?? row.dailySummary,
      lockUserPreferences: row.lockUserPreferences,
    }
  } catch {
    return defaultCompanyNotificationSettings
  }
}

export async function updateCompanyNotificationSettings(input: {
  companyId: string
  patch: Partial<CompanyNotificationDefaults>
}) {
  const current = await getCompanyNotificationSettings(input.companyId)

  const next = {
    inAppEnabled: input.patch.inAppEnabled ?? current.inAppEnabled,
    emailEnabled: input.patch.emailEnabled ?? current.emailEnabled,
    inAppReservationAlerts: input.patch.inAppReservationAlerts ?? current.inAppReservationAlerts,
    inAppRequestAlerts: input.patch.inAppRequestAlerts ?? current.inAppRequestAlerts,
    emailReservationAlerts: input.patch.emailReservationAlerts ?? current.emailReservationAlerts,
    emailRequestAlerts: input.patch.emailRequestAlerts ?? current.emailRequestAlerts,
    inAppDailySummary: input.patch.inAppDailySummary ?? current.inAppDailySummary,
    emailDailySummary: input.patch.emailDailySummary ?? current.emailDailySummary,
    lockUserPreferences: input.patch.lockUserPreferences ?? current.lockUserPreferences,
  }

  await db
    .insert(companyNotificationSettings)
    .values({
      companyId: input.companyId,
      inAppEnabled: next.inAppEnabled,
      emailEnabled: next.emailEnabled,
      inAppReservationAlerts: next.inAppReservationAlerts,
      inAppRequestAlerts: next.inAppRequestAlerts,
      emailReservationAlerts: next.emailReservationAlerts,
      emailRequestAlerts: next.emailRequestAlerts,
      inAppDailySummary: next.inAppDailySummary,
      emailDailySummary: next.emailDailySummary,
      lockUserPreferences: next.lockUserPreferences,
      reservationAlerts: next.emailReservationAlerts,
      requestAlerts: next.emailRequestAlerts,
      dailySummary: next.emailDailySummary || next.inAppDailySummary,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [companyNotificationSettings.companyId],
      set: {
        inAppEnabled: next.inAppEnabled,
        emailEnabled: next.emailEnabled,
        inAppReservationAlerts: next.inAppReservationAlerts,
        inAppRequestAlerts: next.inAppRequestAlerts,
        emailReservationAlerts: next.emailReservationAlerts,
        emailRequestAlerts: next.emailRequestAlerts,
        inAppDailySummary: next.inAppDailySummary,
        emailDailySummary: next.emailDailySummary,
        lockUserPreferences: next.lockUserPreferences,
        reservationAlerts: next.emailReservationAlerts,
        requestAlerts: next.emailRequestAlerts,
        dailySummary: next.emailDailySummary || next.inAppDailySummary,
        updatedAt: new Date(),
      },
    })

  return next
}

export async function applyCompanyNotificationSettingsToMembers(companyId: string) {
  const settings = await getCompanyNotificationSettings(companyId)
  const memberships = await db.query.userCompanyMemberships.findMany({
    where: eq(userCompanyMemberships.companyId, companyId),
  })

  const userIds = [...new Set(memberships.map((membership) => membership.userId).filter(Boolean))]

  if (userIds.length === 0) {
    return
  }

  const usersRows = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: {
      id: true,
      role: true,
    },
  })

  const membershipByUserId = new Map(memberships.map((membership) => [membership.userId, membership]))

  await Promise.all(
    usersRows.map(async (user) => {
      const membership = membershipByUserId.get(user.id)
      const isAdmin = membership?.role === 'admin' || user.role === 'superadmin'
      const inAppDailySummary = isAdmin ? settings.inAppDailySummary : false
      const emailDailySummary = isAdmin ? settings.emailDailySummary : false

      await db
        .insert(userNotificationPreferences)
        .values({
          id: crypto.randomUUID(),
          companyId,
          userId: user.id,
          inAppEnabled: settings.inAppEnabled,
          emailEnabled: settings.emailEnabled,
          inAppReservationAlerts: settings.inAppReservationAlerts,
          inAppRequestAlerts: settings.inAppRequestAlerts,
          emailReservationAlerts: settings.emailReservationAlerts,
          emailRequestAlerts: settings.emailRequestAlerts,
          inAppDailySummary,
          emailDailySummary,
          dailySummary: inAppDailySummary || emailDailySummary,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userNotificationPreferences.userId, userNotificationPreferences.companyId],
          set: {
            inAppEnabled: settings.inAppEnabled,
            emailEnabled: settings.emailEnabled,
            inAppReservationAlerts: settings.inAppReservationAlerts,
            inAppRequestAlerts: settings.inAppRequestAlerts,
            emailReservationAlerts: settings.emailReservationAlerts,
            emailRequestAlerts: settings.emailRequestAlerts,
            inAppDailySummary,
            emailDailySummary,
            dailySummary: inAppDailySummary || emailDailySummary,
            updatedAt: new Date(),
          },
        })
    })
  )
}

async function getUserRoleInCompany(userId: string, companyId: string): Promise<NotificationRole> {
  const membership = await db.query.userCompanyMemberships.findFirst({
    where: and(eq(userCompanyMemberships.userId, userId), eq(userCompanyMemberships.companyId, companyId)),
  })

  if (membership?.role === 'admin') {
    return 'admin'
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (user?.role === 'superadmin') {
    return 'superadmin'
  }

  return 'user'
}

export async function getNotificationPreferences(userId: string, companyId: string) {
  const role = await getUserRoleInCompany(userId, companyId)
  const companyDefaults = await getCompanyNotificationSettings(companyId)

  if (!isAdminRole(role) && companyDefaults.lockUserPreferences) {
    return buildPreferencesFromCompanyDefaults(role, companyDefaults)
  }

  try {
    const row = await db.query.userNotificationPreferences.findFirst({
      where: and(
        eq(userNotificationPreferences.userId, userId),
        eq(userNotificationPreferences.companyId, companyId)
      ),
    })

    if (!row) {
      return buildPreferencesFromCompanyDefaults(role, companyDefaults)
    }

    const isAdmin = isAdminRole(role)
    const inAppDailySummary = isAdmin ? row.inAppDailySummary : false
    const emailDailySummary = isAdmin ? row.emailDailySummary : false

    return {
      inAppEnabled: row.inAppEnabled,
      emailEnabled: row.emailEnabled,
      inAppReservationAlerts: row.inAppReservationAlerts,
      inAppRequestAlerts: row.inAppRequestAlerts,
      emailReservationAlerts: row.emailReservationAlerts,
      emailRequestAlerts: row.emailRequestAlerts,
      inAppDailySummary,
      emailDailySummary,
      dailySummary: inAppDailySummary || emailDailySummary,
      lockedByAdmin: companyDefaults.lockUserPreferences,
      isAdmin,
    }
  } catch {
    return buildPreferencesFromCompanyDefaults(role, companyDefaults)
  }
}

export async function updateNotificationPreferences(input: {
  userId: string
  companyId: string
  patch: UserNotificationPreferencesPatch
}) {
  const current = await getNotificationPreferences(input.userId, input.companyId)
  const requestedInAppDailySummary = input.patch.inAppDailySummary ?? input.patch.dailySummary
  const requestedEmailDailySummary = input.patch.emailDailySummary ?? input.patch.dailySummary

  const next = {
    inAppEnabled: input.patch.inAppEnabled ?? current.inAppEnabled,
    emailEnabled: input.patch.emailEnabled ?? current.emailEnabled,
    inAppReservationAlerts: input.patch.inAppReservationAlerts ?? current.inAppReservationAlerts,
    inAppRequestAlerts: input.patch.inAppRequestAlerts ?? current.inAppRequestAlerts,
    emailReservationAlerts: input.patch.emailReservationAlerts ?? current.emailReservationAlerts,
    emailRequestAlerts: input.patch.emailRequestAlerts ?? current.emailRequestAlerts,
    inAppDailySummary: current.isAdmin ? requestedInAppDailySummary ?? current.inAppDailySummary : false,
    emailDailySummary: current.isAdmin ? requestedEmailDailySummary ?? current.emailDailySummary : false,
  }

  await db
    .insert(userNotificationPreferences)
    .values({
      id: crypto.randomUUID(),
      companyId: input.companyId,
      userId: input.userId,
      inAppEnabled: next.inAppEnabled,
      emailEnabled: next.emailEnabled,
      inAppReservationAlerts: next.inAppReservationAlerts,
      inAppRequestAlerts: next.inAppRequestAlerts,
      emailReservationAlerts: next.emailReservationAlerts,
      emailRequestAlerts: next.emailRequestAlerts,
      inAppDailySummary: next.inAppDailySummary,
      emailDailySummary: next.emailDailySummary,
      dailySummary: next.inAppDailySummary || next.emailDailySummary,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userNotificationPreferences.userId, userNotificationPreferences.companyId],
      set: {
        inAppEnabled: next.inAppEnabled,
        emailEnabled: next.emailEnabled,
        inAppReservationAlerts: next.inAppReservationAlerts,
        inAppRequestAlerts: next.inAppRequestAlerts,
        emailReservationAlerts: next.emailReservationAlerts,
        emailRequestAlerts: next.emailRequestAlerts,
        inAppDailySummary: next.inAppDailySummary,
        emailDailySummary: next.emailDailySummary,
        dailySummary: next.inAppDailySummary || next.emailDailySummary,
        updatedAt: new Date(),
      },
    })

  return {
    ...next,
    dailySummary: next.inAppDailySummary || next.emailDailySummary,
    lockedByAdmin: current.lockedByAdmin,
    isAdmin: current.isAdmin,
  }
}

export async function canSendInAppNotification(input: {
  userId: string
  companyId: string
  type: NotificationType
}) {
  const preferences = await getNotificationPreferences(input.userId, input.companyId)
  return isTypeEnabledForInApp(input.type, preferences)
}

export async function canSendEmailNotification(input: {
  userId: string
  companyId: string
  type: NotificationType
}) {
  const preferences = await getNotificationPreferences(input.userId, input.companyId)
  return isTypeEnabledForEmail(input.type, preferences)
}

export async function createNotification(input: CreateNotificationInput) {
  const canSend = await canSendInAppNotification({
    userId: input.userId,
    companyId: input.companyId,
    type: input.type,
  })

  if (!canSend) {
    return
  }

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    companyId: input.companyId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
  })
}

export async function createNotificationsForUsers(input: {
  companyId: string
  userIds: string[]
  type: NotificationType
  title: string
  message: string
}) {
  const uniqueUserIds = [...new Set(input.userIds.filter(Boolean))]

  if (uniqueUserIds.length === 0) {
    return
  }

  const deliverableUsers: string[] = []

  for (const userId of uniqueUserIds) {
    const canSend = await canSendInAppNotification({
      userId,
      companyId: input.companyId,
      type: input.type,
    })

    if (canSend) {
      deliverableUsers.push(userId)
    }
  }

  if (deliverableUsers.length === 0) {
    return
  }

  await db.insert(notifications).values(
    deliverableUsers.map((userId) => ({
      id: crypto.randomUUID(),
      companyId: input.companyId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
    }))
  )
}

export async function getAdminUserIds(companyId: string) {
  try {
    const memberships = await db.query.userCompanyMemberships.findMany({
      where: and(eq(userCompanyMemberships.companyId, companyId), eq(userCompanyMemberships.role, 'admin')),
    })

    return memberships.map((membership) => membership.userId)
  } catch {
    const legacyAdmins = await db.query.users.findMany({
      where: and(eq(users.companyId, companyId), eq(users.role, 'admin')),
    })

    return legacyAdmins.map((user) => user.id)
  }
}

export async function markNotificationRead(notificationId: string, userId: string, companyId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), eq(notifications.companyId, companyId)))
}

export async function markAllNotificationsRead(userId: string, companyId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.companyId, companyId), eq(notifications.read, false)))
}

export async function deleteNotificationsForUser(ids: string[], userId: string, companyId: string) {
  if (ids.length === 0) {
    return
  }

  await db
    .delete(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.companyId, companyId), inArray(notifications.id, ids)))
}
