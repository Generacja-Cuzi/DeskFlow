"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  Shield,
  Palette,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { name: "Firmy", href: "/superadmin/firmy", icon: Building2 },
  { name: "Uzytkownicy", href: "/superadmin/uzytkownicy", icon: Users },
  { name: "Subskrypcje", href: "/superadmin/subskrypcje", icon: CreditCard },
  { name: "Ustawienia", href: "/superadmin/ustawienia", icon: Settings },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user } = useUser()

  const currentUser = {
    name: user?.fullName || user?.firstName || "Super Admin",
    email: user?.primaryEmailAddress?.emailAddress || "admin@deskflow.io",
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">DeskFlow</h1>
          <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30">
            Super Admin
          </Badge>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-sm">
              SA
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
