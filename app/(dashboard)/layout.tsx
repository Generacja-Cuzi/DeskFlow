import { AppSidebar } from "@/components/app-sidebar"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { BrandingProvider } from "@/lib/contexts/branding-context"
import { ReservationProvider } from "@/lib/contexts/reservation-context"
import { Button } from "@/components/ui/button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Witaj w DeskFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj sie albo utworz konto, aby wejsc do panelu.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <SignInButton>
              <Button>Zaloguj sie</Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline">Zarejestruj sie</Button>
            </SignUpButton>
          </div>
        </div>
      </div>
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
