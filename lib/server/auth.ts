import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { companies, userCompanyMemberships, users } from '@/lib/db/schema'

const defaultSuperadminEmails = ['272715@student.pwr.edu.pl']

function getSuperadminEmails() {
  const fromEnv = process.env.SUPERADMIN_EMAILS
    ? process.env.SUPERADMIN_EMAILS.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    : []

  return new Set([...defaultSuperadminEmails, ...fromEnv])
}

export async function getActor() {
  const { userId } = await auth()

  if (!userId) {
    const fallback = await db.query.users.findFirst({
      where: eq(users.email, '272715@student.pwr.edu.pl'),
    })

    return {
      clerkUserId: null,
      user: fallback ?? null,
    }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (user) {
    return {
      clerkUserId: userId,
      user,
    }
  }

  const clerkProfile = await currentUser()
  const clerkEmail =
    clerkProfile?.emailAddresses.find((address) => address.id === clerkProfile.primaryEmailAddressId)
      ?.emailAddress || clerkProfile?.emailAddresses[0]?.emailAddress || null

  const normalizedEmail = clerkEmail?.toLowerCase() || null
  const superadminEmails = getSuperadminEmails()
  const isSuperadminEmail = normalizedEmail ? superadminEmails.has(normalizedEmail) : false

  if (!normalizedEmail) {
    return {
      clerkUserId: userId,
      user: null,
    }
  }

  const userByEmail = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  })

  if (!userByEmail && isSuperadminEmail) {
    const name = clerkProfile?.fullName || clerkProfile?.firstName || clerkProfile?.username || 'Superadmin'

    await db.insert(users).values({
      id: userId,
      companyId: null,
      name,
      email: normalizedEmail,
      department: 'Management',
      role: 'superadmin',
      status: 'active',
    })

    const createdSuperadmin = await db.query.users.findFirst({ where: eq(users.id, userId) })

    return {
      clerkUserId: userId,
      user: createdSuperadmin ?? null,
    }
  }

  if (!userByEmail) {
    return {
      clerkUserId: userId,
      user: null,
    }
  }

  const nextName =
    clerkProfile?.fullName || clerkProfile?.firstName || clerkProfile?.username || userByEmail.name

  await db
    .update(users)
    .set({
      id: userId,
      name: nextName,
      email: normalizedEmail,
      role: isSuperadminEmail ? 'superadmin' : userByEmail.role,
      status: userByEmail.status || 'active',
    })
    .where(eq(users.id, userByEmail.id))

  const linkedUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return {
    clerkUserId: userId,
    user: linkedUser ?? null,
  }
}

export async function getActorMemberships() {
  const actor = await getActor()

  if (!actor.user) {
    return [] as Array<{
      id: string
      companyId: string
      companyName: string
      role: string
      status: string
    }>
  }

  try {
    const memberships = await db.query.userCompanyMemberships.findMany({
      where: eq(userCompanyMemberships.userId, actor.user.id),
      with: {
        company: true,
      },
      orderBy: [asc(userCompanyMemberships.createdAt)],
    })

    if (memberships.length > 0) {
      return memberships.map((membership) => ({
        id: membership.id,
        companyId: membership.companyId,
        companyName: membership.company?.name || 'Firma',
        role: membership.role,
        status: membership.status,
      }))
    }
  } catch {
    // Membership table may not exist before migration; fallback to legacy user.companyId.
  }

  if (!actor.user.companyId) {
    return []
  }

  const legacyCompany = await db.query.companies.findFirst({ where: eq(companies.id, actor.user.companyId) })

  return [
    {
      id: `legacy-${actor.user.id}-${actor.user.companyId}`,
      companyId: actor.user.companyId,
      companyName: legacyCompany?.name || 'Firma',
      role: actor.user.role,
      status: actor.user.status,
    },
  ]
}

export async function getActorMembershipForCompany(companyId: string) {
  const actor = await getActor()

  if (!actor.user) {
    return null
  }

  if (actor.user.role === 'superadmin') {
    return {
      role: 'superadmin',
      status: 'active',
      companyId,
    }
  }

  try {
    const membership = await db.query.userCompanyMemberships.findFirst({
      where: and(eq(userCompanyMemberships.userId, actor.user.id), eq(userCompanyMemberships.companyId, companyId)),
    })

    if (membership) {
      return membership
    }
  } catch {
    // Membership table may not exist before migration; fallback to legacy columns.
  }

  if (actor.user.companyId === companyId) {
    return {
      role: actor.user.role,
      status: actor.user.status,
      companyId,
    }
  }

  return null
}

export async function canManageCompany(companyId: string) {
  const actor = await getActor()

  if (!actor.user) {
    return false
  }

  if (actor.user.role === 'superadmin') {
    return true
  }

  const membership = await getActorMembershipForCompany(companyId)
  return !!membership && membership.status === 'active' && membership.role === 'admin'
}

export function ensureCompanyId(input?: string | null) {
  return input || 'company-techstart'
}
