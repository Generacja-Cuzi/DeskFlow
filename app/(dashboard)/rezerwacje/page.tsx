"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Monitor,
import { useEffect, useState } from "react"
  Package,
  Calendar,
  Clock,
  X,
  MapPin,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Reservation {
  const [reservations, setReservations] = useState<Reservation[]>([])
  id: string
  type: "desk" | "room" | "equipment"
  name: string
  location: string
  date: Date
  startTime: string
  endTime: string
  status: "active" | "upcoming" | "completed" | "cancelled"
}

const reservations: Reservation[] = [
  { id: "1", type: "desk", name: "Biurko A-12", location: "Strefa A, Pietro 1", date: new Date(), startTime: "09:00", endTime: "17:00", status: "active" },
  { id: "2", type: "room", name: "Sala Konferencyjna B", location: "Pietro 1", date: new Date(Date.now() + 86400000), startTime: "10:00", endTime: "12:00", status: "upcoming" },
  { id: "3", type: "equipment", name: "MacBook Pro 16\"", location: "Magazyn IT", date: new Date(Date.now() + 86400000 * 2), startTime: "08:00", endTime: "18:00", status: "upcoming" },
  { id: "4", type: "desk", name: "Biurko C-05", location: "Strefa C, Pietro 2", date: new Date(Date.now() + 86400000 * 3), startTime: "09:00", endTime: "17:00", status: "upcoming" },
  { id: "5", type: "room", name: "Sala D - Duza", location: "Pietro 2", date: new Date(Date.now() - 86400000), startTime: "14:00", endTime: "16:00", status: "completed" },
  { id: "6", type: "equipment", name: "Projektor Epson", location: "Magazyn IT", date: new Date(Date.now() - 86400000 * 2), startTime: "09:00", endTime: "18:00", status: "completed" },
  { id: "7", type: "desk", name: "Biurko B-03", location: "Strefa B, Pietro 1", date: new Date(Date.now() - 86400000 * 3), startTime: "09:00", endTime: "17:00", status: "cancelled" },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "desk":
      return Monitor
    case "room":
      return Users
    case "equipment":
      return Package
    default:
      return Calendar
  }
}

const getTypeName = (type: string) => {
  switch (type) {
    case "desk":
  const confirmCancelReservation = async () => {
    if (!selectedReservation) return

    const response = await fetch(`/api/reservations/${selectedReservation.id}/cancel`, {
      method: "PATCH",
    })

    if (response.ok) {
      await loadReservations()
      setShowCancelDialog(false)
      setSelectedReservation(null)
    }
  }
      return "Biurko"
    case "room":
      return "Sala"
    case "equipment":
            <Button variant="destructive" onClick={confirmCancelReservation}>
    default:
      return "Rezerwacja"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-accent text-accent-foreground">Aktywna</Badge>
    case "upcoming":
      return <Badge className="bg-primary text-primary-foreground">Nadchodzaca</Badge>
    case "completed":
      return <Badge variant="secondary">Zakonczona</Badge>
    case "cancelled":
      return <Badge variant="destructive">Anulowana</Badge>
    default:
      return null
  }
}

export default function RezerwacjePage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const activeReservations = reservations.filter(r => r.status === "active" || r.status === "upcoming")
  const pastReservations = reservations.filter(r => r.status === "completed" || r.status === "cancelled")

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowCancelDialog(true)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)
    
    if (date.toDateString() === today.toDateString()) {
      return "Dzis"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Jutro"
    }
    return format(date, "d MMMM yyyy", { locale: pl })
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Moje rezerwacje</h1>
          <p className="text-muted-foreground mt-1">
            Przegladaj i zarzadzaj swoimi rezerwacjami
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {activeReservations.length} aktywnych
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Aktywne ({activeReservations.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historia ({pastReservations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeReservations.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Brak aktywnych rezerwacji</p>
                <p className="text-sm text-muted-foreground">
                  Zarezerwuj biurko, sale lub wypozycz sprzet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeReservations.map((reservation) => {
                const Icon = getTypeIcon(reservation.type)
                return (
                  <Card key={reservation.id} className={cn(
                    "transition-all hover:shadow-md",
                    reservation.status === "active" && "border-accent"
                  )}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl shrink-0",
                          reservation.status === "active" ? "bg-accent/10" : "bg-primary/10"
                        )}>
                          <Icon className={cn(
                            "h-7 w-7",
                            reservation.status === "active" ? "text-accent" : "text-primary"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getTypeName(reservation.type)}
                            </Badge>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <h3 className="text-lg font-semibold">{reservation.name}</h3>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {reservation.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(reservation.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {reservation.startTime} - {reservation.endTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline">
                            Szczegoly
                          </Button>
                          <Button
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelClick(reservation)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {pastReservations.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Brak historii rezerwacji</p>
                <p className="text-sm text-muted-foreground">
                  Twoja historia rezerwacji pojawi sie tutaj
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastReservations.map((reservation) => {
                const Icon = getTypeIcon(reservation.type)
                return (
                  <Card key={reservation.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{reservation.name}</p>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(reservation.date, "d MMM yyyy", { locale: pl })} • {reservation.startTime} - {reservation.endTime}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Anuluj rezerwacje
            </DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz anulowac te rezerwacje?
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="py-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zasob:</span>
                  <span className="font-medium">{selectedReservation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{formatDate(selectedReservation.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Godziny:</span>
                  <span>{selectedReservation.startTime} - {selectedReservation.endTime}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Nie, zachowaj
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelDialog(false)}>
              Tak, anuluj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
