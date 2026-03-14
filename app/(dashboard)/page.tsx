"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Monitor,
  Users,
  Package,
  Calendar,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    name: "Dostepne biurka",
    value: "24",
    total: "40",
    icon: Monitor,
    href: "/biurka",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    name: "Wolne sale",
    value: "3",
    total: "8",
    icon: Users,
    href: "/sale",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    name: "Sprzet do wypozyczenia",
    value: "15",
    total: "32",
    icon: Package,
    href: "/sprzet",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    name: "Twoje rezerwacje",
    value: "5",
    total: "",
    icon: Calendar,
    href: "/rezerwacje",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
]

const upcomingReservations = [
  {
    id: 1,
    type: "Biurko",
    name: "Biurko A-12",
    date: "Dzis",
    time: "09:00 - 17:00",
    status: "active",
  },
  {
    id: 2,
    type: "Sala",
    name: "Sala Konferencyjna B",
    date: "Jutro",
    time: "10:00 - 12:00",
    status: "upcoming",
  },
  {
    id: 3,
    type: "Sprzet",
    name: "MacBook Pro 16",
    date: "15.03.2026",
    time: "Caly dzien",
    status: "upcoming",
  },
]

const recentActivity = [
  { action: "Zarezerwowano biurko A-12", time: "2 godziny temu" },
  { action: "Zwrocono projektor Epson", time: "Wczoraj" },
  { action: "Anulowano rezerwacje sali C", time: "2 dni temu" },
  { action: "Wypozyczono laptop Dell XPS", time: "3 dni temu" },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Witaj, Jan!</h1>
        <p className="text-muted-foreground mt-1">
          Oto podsumowanie dostepnosci zasobow w Twojej firmie.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Link href={stat.href}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {stat.total}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Szybkie akcje</CardTitle>
          <CardDescription>Zarezerwuj lub wypozycz jednym kliknieciem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/biurka">
              <Button className="gap-2">
                <Monitor className="h-4 w-4" />
                Zarezerwuj biurko
              </Button>
            </Link>
            <Link href="/sale">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Zarezerwuj sale
              </Button>
            </Link>
            <Link href="/sprzet">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                Wypozycz sprzet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nadchodzace rezerwacje</CardTitle>
              <CardDescription>Twoje najblizsze rezerwacje</CardDescription>
            </div>
            <Link href="/rezerwacje">
              <Button variant="outline" size="sm">
                Zobacz wszystkie
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={reservation.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {reservation.type}
                      </Badge>
                      {reservation.status === "active" && (
                        <Badge variant="outline" className="text-xs text-accent border-accent">
                          Aktywna
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium truncate">{reservation.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{reservation.date}, {reservation.time}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Szczegoly
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Ostatnia aktywnosc</CardTitle>
            </div>
            <CardDescription>Historia Twoich dzialan w systemie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
