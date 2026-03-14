import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

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

export function ensureCompanyId(input?: string | null) {
  return input || 'company-techstart'
}
