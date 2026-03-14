"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Plus,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    name: "Aktywne firmy",
    value: "24",
    change: "+3 w tym miesiacu",
    icon: Building2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Laczna liczba uzytkownikow",
    value: "1,247",
    change: "+156 w tym miesiacu",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    name: "Rezerwacje dzis",
    value: "892",
    change: "+12% vs wczoraj",
    icon: Activity,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    name: "MRR",
    value: "48,200 PLN",
    change: "+8% MoM",
    icon: TrendingUp,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
]

const recentCompanies = [
  { id: 1, name: "TechStart Sp. z o.o.", users: 45, plan: "Business", status: "active", joinedAt: "2 dni temu" },
  { id: 2, name: "Marketing Pro", users: 23, plan: "Starter", status: "active", joinedAt: "5 dni temu" },
  { id: 3, name: "Design Studio XYZ", users: 12, plan: "Starter", status: "trial", joinedAt: "tydzien temu" },
  { id: 4, name: "FinanceHub", users: 89, plan: "Enterprise", status: "active", joinedAt: "2 tygodnie temu" },
]

export default function SuperAdminDashboard() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Panel Super Admina</h1>
          <p className="text-muted-foreground mt-1">
            Zarzadzaj wszystkimi firmami i uzytkownikami DeskFlow
          </p>
        </div>
        <Link href="/superadmin/firmy">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj firme
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ostatnio dodane firmy</CardTitle>
              <CardDescription>Nowi klienci DeskFlow</CardDescription>
            </div>
            <Link href="/superadmin/firmy">
              <Button variant="ghost" size="sm" className="gap-1">
                Zobacz wszystkie <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.users} uzytkownikow</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={company.status === "active" ? "default" : "secondary"}
                      className={company.status === "trial" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""}
                    >
                      {company.plan}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{company.joinedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wykorzystanie platformy</CardTitle>
            <CardDescription>Statystyki z ostatnich 7 dni</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rezerwacje biurek</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">4,521</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rezerwacje sal</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-emerald-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">2,103</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Wypozyczenia sprzetu</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-amber-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">892</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Aktywni uzytkownicy</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-purple-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">1,089</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
