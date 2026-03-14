import { SuperAdminSidebar } from "@/components/super-admin-sidebar"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}
