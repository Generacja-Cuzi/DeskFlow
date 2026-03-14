import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { auth } from "@clerk/nextjs/server"
import { AuthLanding } from "@/components/auth-landing"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    return (
      <AuthLanding
        title="Panel Superadmin DeskFlow"
        subtitle="Zaloguj sie albo zarejestruj, aby zarzadzac firmami, konfiguracja i dostepem do calej platformy."
      />
    )
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}
