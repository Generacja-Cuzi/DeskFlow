import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export async function getActor() {
  const { userId } = await auth()

  if (!userId) {
    const fallback = await db.query.users.findFirst({
      where: eq(users.email, 'jan.kowalski@firma.pl'),
    })

    return {
      clerkUserId: null,
      user: fallback ?? null,
    }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return {
    clerkUserId: userId,
    user: user ?? null,
  }
}

export function ensureCompanyId(input?: string | null) {
  return input || 'company-techstart'
}
