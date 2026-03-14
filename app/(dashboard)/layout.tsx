import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@clerk/nextjs/server"
import { BrandingProvider } from "@/lib/contexts/branding-context"
import { ReservationProvider } from "@/lib/contexts/reservation-context"
import { AuthLanding } from "@/components/auth-landing"
import { getActor } from "@/lib/server/auth"
import { getActiveCompanyId } from "@/lib/server/company"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    return (
      <AuthLanding
        title="Zarzadzaj biurem z jednego miejsca"
        subtitle="Zaloguj sie lub utworz konto, aby przejsc do panelu DeskFlow i zarzadzac rezerwacjami, zasobami oraz uzytkownikami firmy."
      />
    )
  }

  const actor = await getActor()
  const activeCompanyId = await getActiveCompanyId()

  if (actor.user?.role === "superadmin" && !activeCompanyId) {
    redirect("/superadmin")
  }

  if (!activeCompanyId) {
    return (
      <AuthLanding
        title="Nie jestes dodany do zadnej organizacji"
        subtitle="Skontaktuj sie ze swoim administratorem, aby przypisal Ci firme i nadac dostep do panelu."
        showAuthActions={false}
        showSignOutAction
      />
    )
  }

  return (
    <BrandingProvider>
      <ReservationProvider>
        <div className="flex h-screen bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </ReservationProvider>
    </BrandingProvider>
  )
}
