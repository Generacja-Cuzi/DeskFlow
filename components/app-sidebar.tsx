"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Monitor,
  Users,
  Calendar,
  Package,
  Bell,
  Settings,
  LogOut,
  Building2,
  Layers,
  Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCompanyLogo } from "@/lib/contexts/branding-context"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Biurka", href: "/biurka", icon: Monitor },
  { name: "Sale konferencyjne", href: "/sale", icon: Users },
  { name: "Sprzet", href: "/sprzet", icon: Package },
  { name: "Moje rezerwacje", href: "/rezerwacje", icon: Calendar },
  { name: "Powiadomienia", href: "/powiadomienia", icon: Bell },
]

const adminNavigation = [
  { name: "Panel admina", href: "/admin", icon: Settings },
  { name: "Edytor pieter", href: "/admin/pietra", icon: Layers },
  { name: "Ustawienia firmy", href: "/admin/ustawienia-firmy", icon: Palette },
]

const superAdminNavigation = [
  { name: "Panel superadmina", href: "/superadmin", icon: Building2 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { logo, fallback, primaryColor, companyName } = useCompanyLogo()
  const [resolvedRole, setResolvedRole] = useState<"superadmin" | "admin" | "user">("user")
  const [impersonatedCompanyName, setImpersonatedCompanyName] = useState<string | null>(null)
  const [membershipCount, setMembershipCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const loadAuthState = async () => {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!response.ok) return

      const data = await response.json()
      const role = (data?.user?.role as "superadmin" | "admin" | "user" | undefined) || "user"
      setResolvedRole(role)
      setMembershipCount(Array.isArray(data?.memberships) ? data.memberships.length : 0)

      if (data?.impersonation?.active) {
        setImpersonatedCompanyName(data?.impersonation?.companyName || "Wybrana firma")
        return
      }

      if (role !== "superadmin") {
        localStorage.removeItem("superadminImpersonation")
        localStorage.removeItem("companyBranding")
        setImpersonatedCompanyName(null)
        return
      }

      const saved = localStorage.getItem("superadminImpersonation")
      if (!saved) {
        setImpersonatedCompanyName(null)
        return
      }

      try {
        const parsed = JSON.parse(saved) as { companyName?: string }
        setImpersonatedCompanyName(parsed.companyName || null)
      } catch {
        setImpersonatedCompanyName(null)
      }
    }

    loadAuthState()
  }, [])

  useEffect(() => {
    let mounted = true

    const loadUnreadCount = async () => {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok || !mounted) {
        return
      }

      const data = await response.json()
      setUnreadNotifications(typeof data?.unreadCount === 'number' ? data.unreadCount : 0)
    }

    loadUnreadCount()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      loadUnreadCount()
    }, 10000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const currentUser = {
    name: user?.fullName || user?.firstName || "Uzytkownik",
    email: user?.primaryEmailAddress?.emailAddress || "",
    role: resolvedRole,
    imageUrl: user?.imageUrl,
  }

  const isImpersonating = !!impersonatedCompanyName
  const isSuperAdmin = currentUser.role === "superadmin" && !isImpersonating
  const canAccessAdmin = currentUser.role === "admin" || isImpersonating
  const canSwitchCompany = membershipCount > 1 && !isImpersonating && currentUser.role !== "superadmin"

  const handleExitImpersonation = async () => {
    await fetch('/api/superadmin/impersonation', {
      method: 'DELETE',
    })

    await fetch('/api/auth/active-company', {
      method: 'DELETE',
    })

    localStorage.removeItem("superadminImpersonation")
    localStorage.removeItem("companyBranding")
    router.push("/superadmin/firmy")
    router.refresh()
  }

  const handleSignOut = async () => {
    await fetch('/api/superadmin/impersonation', {
      method: 'DELETE',
    })

    await fetch('/api/auth/active-company', {
      method: 'DELETE',
    })

    localStorage.removeItem("superadminImpersonation")
    localStorage.removeItem("companyBranding")
    await signOut()
  }

  const handleSwitchCompany = async () => {
    await fetch('/api/auth/active-company', {
      method: 'DELETE',
    })

    router.push('/')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <Avatar className="h-10 w-10">
          {logo ? (
            <AvatarImage src={logo} alt={companyName} className="object-contain" />
          ) : (
            <AvatarFallback 
              style={{ backgroundColor: primaryColor }} 
              className="text-white font-semibold"
            >
              {fallback}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h1 className="font-semibold text-lg">{companyName}</h1>
          <p className="text-xs text-sidebar-foreground/60">Rezerwacje i zasoby</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {isImpersonating && (
          <div className="mx-2 mb-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-xs uppercase tracking-wide text-sidebar-foreground/60">Tryb podgladu</p>
            <p className="text-sm font-medium text-sidebar-foreground">{impersonatedCompanyName}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={handleExitImpersonation}
            >
              Wroc do superadmina
            </Button>
          </div>
        )}

        {canSwitchCompany && (
          <div className="mx-2 mb-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-xs uppercase tracking-wide text-sidebar-foreground/60">Wiele firm</p>
            <p className="text-sm font-medium text-sidebar-foreground">Masz dostep do {membershipCount} firm</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={handleSwitchCompany}
            >
              Zmien firme
            </Button>
          </div>
        )}

        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.href === '/powiadomienia' && unreadNotifications > 0 && (
                <Badge variant="secondary" className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-sidebar-border">
          {canAccessAdmin && (
            <>
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Administracja
              </p>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}

          {isSuperAdmin && (
            <>
              <p className="px-3 pt-4 pb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Superadmin
              </p>
              {superAdminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            {currentUser.imageUrl ? (
              <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
            ) : (
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser.email}</p>
            <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/50">
              {isImpersonating ? "admin firmy" : currentUser.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
