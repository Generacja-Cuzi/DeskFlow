import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { notifications, userCompanyMemberships, users } from '@/lib/db/schema'

export type NotificationType = 'reservation' | 'equipment' | 'reminder' | 'approval' | 'rejection' | 'info'

type CreateNotificationInput = {
  companyId: string
  userId: string
  type: NotificationType
  title: string
  message: string
}

export async function createNotification(input: CreateNotificationInput) {
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

  await db.insert(notifications).values(
    uniqueUserIds.map((userId) => ({
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
