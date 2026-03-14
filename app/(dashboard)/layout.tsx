import { AppSidebar } from "@/components/app-sidebar"
import { BrandingProvider } from "@/lib/contexts/branding-context"
import { ReservationProvider } from "@/lib/contexts/reservation-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
