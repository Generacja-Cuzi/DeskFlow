"use client"

import { useEffect, useState } from "react"
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
  timestamp: string
  read: boolean
}

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

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.valueOf())) {
    return "Przed chwila"
  }

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
  const [notificationsList, setNotificationsList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settings, setSettings] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    inAppReservationAlerts: true,
    inAppRequestAlerts: true,
    emailReservationAlerts: true,
    emailRequestAlerts: true,
    inAppDailySummary: false,
    emailDailySummary: false,
    dailySummary: false,
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [lockedByAdmin, setLockedByAdmin] = useState(false)

  const unreadCount = notificationsList.filter(n => !n.read).length

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" })
      if (!response.ok) {
        setRequestError("Nie udalo sie pobrac powiadomien.")
        return
      }

      const data = await response.json()
      setNotificationsList(Array.isArray(data.notifications) ? data.notifications : [])
      setRequestError(null)
    } catch {
      setRequestError("Nie udalo sie pobrac powiadomien.")
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    const response = await fetch('/api/notifications/preferences', { cache: 'no-store' })

    if (!response.ok) {
      return
    }

    const data = await response.json()

    setSettings((prev) => ({
      ...prev,
      ...(data.preferences || {}),
    }))
    setIsAdmin(Boolean(data.isAdmin))
    setLockedByAdmin(Boolean(data.lockedByAdmin))
  }

  const updatePreference = async (patch: Partial<typeof settings>) => {
    if (lockedByAdmin && !isAdmin) {
      setRequestError('Administrator zablokowal edycje ustawien powiadomien dla uzytkownikow.')
      return
    }

    setSettingsSaving(true)

    const next = { ...settings, ...patch }
    if (!isAdmin) {
      next.inAppDailySummary = false
      next.emailDailySummary = false
      next.dailySummary = false
    } else {
      next.dailySummary = Boolean(next.inAppDailySummary || next.emailDailySummary)
    }

    setSettings(next)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!response.ok) {
        setRequestError('Nie udalo sie zapisac ustawien powiadomien.')
        await loadPreferences()
        setSettingsSaving(false)
        return
      }

      const data = await response.json()
      setSettings((prev) => {
        const merged = { ...prev, ...(data.preferences || {}) }
        return {
          ...merged,
          dailySummary: Boolean(merged.inAppDailySummary || merged.emailDailySummary),
        }
      })
      setIsAdmin(Boolean(data.isAdmin))
      setLockedByAdmin(Boolean(data.lockedByAdmin))
      setRequestError(null)
    } catch {
      setRequestError('Nie udalo sie zapisac ustawien powiadomien.')
      await loadPreferences()
    } finally {
      setSettingsSaving(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    loadPreferences()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return
      }

      loadNotifications()
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [])

  const markAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    })

    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = async (id: string) => {
    const target = notificationsList.find((notification) => notification.id === id)
    if (!target || target.read) {
      return
    }

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read", id }),
    })

    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "DELETE" })
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
          {requestError && <p className="text-sm text-destructive mt-2">{requestError}</p>}
          {lockedByAdmin && !isAdmin && (
            <p className="text-sm text-muted-foreground mt-2">
              Ustawienia sa zarzadzane centralnie przez administratora firmy.
            </p>
          )}
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

          {!loading && notificationsList.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Brak powiadomien</p>
                <p className="text-sm text-muted-foreground">
                  Nie masz zadnych powiadomien
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="py-12">
              <CardContent className="text-center text-sm text-muted-foreground">Ladowanie powiadomien...</CardContent>
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
                    onClick={() => void markAsRead(notification.id)}
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
                                  void deleteNotification(notification.id)
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
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Powiadomienia email</p>
                    <p className="text-sm text-muted-foreground">Otrzymuj powiadomienia na email</p>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                    onCheckedChange={(checked) => void updatePreference({ emailEnabled: checked })}
                  />
                </div>

                {settings.emailEnabled && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alerty o rezerwacjach</p>
                        <p className="text-sm text-muted-foreground">Potwierdzenia i anulacje rezerwacji</p>
                      </div>
                      <Switch
                        checked={settings.emailReservationAlerts}
                        disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                        onCheckedChange={(checked) => void updatePreference({ emailReservationAlerts: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alerty o wnioskach</p>
                        <p className="text-sm text-muted-foreground">Decyzje i nowe wnioski wymagajace akceptacji</p>
                      </div>
                      <Switch
                        checked={settings.emailRequestAlerts}
                        disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                        onCheckedChange={(checked) => void updatePreference({ emailRequestAlerts: checked })}
                      />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Codzienne podsumowanie</p>
                          <p className="text-sm text-muted-foreground">Dzienny raport na email dla administratora</p>
                        </div>
                        <Switch
                          checked={settings.emailDailySummary}
                          disabled={settingsSaving}
                          onCheckedChange={(checked) =>
                            void updatePreference({
                              emailDailySummary: checked,
                              dailySummary: checked || settings.inAppDailySummary,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Powiadomienia w aplikacji</p>
                    <p className="text-sm text-muted-foreground">Powiadomienia widoczne na liscie w aplikacji</p>
                  </div>
                  <Switch
                    checked={settings.inAppEnabled}
                    disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                    onCheckedChange={(checked) => void updatePreference({ inAppEnabled: checked })}
                  />
                </div>

                {settings.inAppEnabled && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alerty o rezerwacjach</p>
                        <p className="text-sm text-muted-foreground">Potwierdzenia i anulacje rezerwacji</p>
                      </div>
                      <Switch
                        checked={settings.inAppReservationAlerts}
                        disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                        onCheckedChange={(checked) => void updatePreference({ inAppReservationAlerts: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alerty o wnioskach</p>
                        <p className="text-sm text-muted-foreground">Decyzje i nowe wnioski wymagajace akceptacji</p>
                      </div>
                      <Switch
                        checked={settings.inAppRequestAlerts}
                        disabled={settingsSaving || (lockedByAdmin && !isAdmin)}
                        onCheckedChange={(checked) => void updatePreference({ inAppRequestAlerts: checked })}
                      />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Codzienne podsumowanie</p>
                          <p className="text-sm text-muted-foreground">Dzienny raport w aplikacji dla administratora</p>
                        </div>
                        <Switch
                          checked={settings.inAppDailySummary}
                          disabled={settingsSaving}
                          onCheckedChange={(checked) =>
                            void updatePreference({
                              inAppDailySummary: checked,
                              dailySummary: checked || settings.emailDailySummary,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
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
                <span className="text-sm">Statusy i informacje</span>
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
