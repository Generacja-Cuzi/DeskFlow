import { redirect } from "next/navigation"

import { getActor, getActorMembershipForCompany } from "@/lib/server/auth"
import { getActiveCompanyId } from "@/lib/server/company"

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const actor = await getActor()

  if (!actor.user) {
    redirect("/")
  }

  const companyId = await getActiveCompanyId()

  if (!companyId) {
    redirect("/")
  }

  const membership = await getActorMembershipForCompany(companyId)

  const isAllowed =
    actor.user.role === "superadmin" ||
    (membership && membership.status === "active" && membership.role === "admin")

  if (!isAllowed) {
    redirect("/")
  }

  return children
}
