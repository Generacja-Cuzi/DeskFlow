"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Trash2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  type: "reservation" | "equipment" | "reminder" | "approval" | "rejection" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "approval",
    title: "Wniosek zaakceptowany",
    message: "Twoj wniosek o wypozyczenie MacBook Pro 16\" zostal zaakceptowany.",
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: "2",
    type: "reminder",
    title: "Przypomnienie o rezerwacji",
    message: "Twoja rezerwacja biurka A-12 rozpoczyna sie za 1 godzine.",
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: "3",
    type: "equipment",
    title: "Zbliża sie termin zwrotu",
    message: "Pamietaj o zwrocie projektora Epson do 15.03.2026.",
    timestamp: new Date(Date.now() - 86400000),
    read: false,
  },
  {
    id: "4",
    type: "reservation",
    title: "Rezerwacja potwierdzona",
    message: "Sala Konferencyjna B zostala zarezerwowana na 12.03.2026, 10:00-12:00.",
    timestamp: new Date(Date.now() - 86400000 * 2),
    read: true,
  },
  {
    id: "5",
    type: "rejection",
    title: "Wniosek odrzucony",
    message: "Twoj wniosek o rezerwacje samochodu sluzbowego zostal odrzucony. Powod: Pojazd w serwisie.",
    timestamp: new Date(Date.now() - 86400000 * 3),
    read: true,
  },
  {
    id: "6",
    type: "info",
    title: "Aktualizacja systemu",
    message: "System DeskFlow zostal zaktualizowany. Sprawdz nowe funkcje!",
    timestamp: new Date(Date.now() - 86400000 * 5),
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "reservation":
      return { icon: Calendar, color: "text-primary", bg: "bg-primary/10" }
    case "equipment":
      return { icon: Package, color: "text-chart-3", bg: "bg-chart-3/10" }
    case "reminder":
      return { icon: Clock, color: "text-chart-5", bg: "bg-chart-5/10" }
    case "approval":
      return { icon: CheckCircle, color: "text-accent", bg: "bg-accent/10" }
    case "rejection":
      return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" }
    case "info":
      return { icon: Info, color: "text-muted-foreground", bg: "bg-muted" }
    default:
      return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" }
  }
}

const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    return "Przed chwila"
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "godzine" : diffHours < 5 ? "godziny" : "godzin"} temu`
  } else if (diffDays === 1) {
    return "Wczoraj"
  } else if (diffDays < 7) {
    return `${diffDays} dni temu`
  }
  return format(date, "d MMM yyyy", { locale: pl })
}

export default function PowiadomieniaPage() {
  const [notificationsList, setNotificationsList] = useState(notifications)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [reminderNotifications, setReminderNotifications] = useState(true)

  const unreadCount = notificationsList.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Powiadomienia</h1>
          <p className="text-muted-foreground mt-1">
            Zarzadzaj swoimi powiadomieniami i ustawieniami
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Oznacz wszystkie jako przeczytane
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{unreadCount} nieprzeczytanych</Badge>
            </div>
          )}

          {notificationsList.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Brak powiadomien</p>
                <p className="text-sm text-muted-foreground">
                  Nie masz zadnych powiadomien
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notificationsList.map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification.type)
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "transition-all cursor-pointer hover:shadow-md",
                      !notification.read && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", bg)}>
                          <Icon className={cn("h-5 w-5", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn(
                                "font-medium",
                                !notification.read && "text-foreground"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ustawienia powiadomien</CardTitle>
              <CardDescription>
                Dostosuj sposob otrzymywania powiadomien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Powiadomienia email</p>
                  <p className="text-sm text-muted-foreground">
                    Otrzymuj powiadomienia na email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Powiadomienia push</p>
                  <p className="text-sm text-muted-foreground">
                    Powiadomienia w przegladarce
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Przypomnienia</p>
                  <p className="text-sm text-muted-foreground">
                    Przypomnienia o rezerwacjach
                  </p>
                </div>
                <Switch
                  checked={reminderNotifications}
                  onCheckedChange={setReminderNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typy powiadomien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <CheckCircle className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm">Zatwierdzenia wnioskow</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm">Potwierdzenia rezerwacji</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10">
                  <Clock className="h-4 w-4 text-chart-5" />
                </div>
                <span className="text-sm">Przypomnienia</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
                  <Package className="h-4 w-4 text-chart-3" />
                </div>
                <span className="text-sm">Terminy zwrotow</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
