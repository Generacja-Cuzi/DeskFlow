"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Monitor, Eye, List } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { InteractiveFloorPlan } from "@/components/interactive-floor-plan"
import { useReservation } from "@/lib/contexts/reservation-context"
import { useBranding } from "@/lib/contexts/branding-context"

export default function BiurkaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"floorplan" | "list">("floorplan")
  
  const { desks, currentFloor, floorPlans } = useReservation()
  const { branding } = useBranding()

  // Filter desks for current floor
  const currentFloorDesks = desks.filter(desk => desk.floor === currentFloor)
  
  // Statistics
  const availableCount = currentFloorDesks.filter(d => d.status === "available").length
  const occupiedCount = currentFloorDesks.filter(d => d.status === "occupied").length
  const reservedCount = currentFloorDesks.filter(d => d.status === "reserved").length
  const totalCount = currentFloorDesks.length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge 
            className="text-white" 
            style={{ backgroundColor: branding.secondaryColor }}
          >
            Dostępne
          </Badge>
        )
      case "occupied":
        return <Badge className="bg-red-500 text-white">Zajęte</Badge>
      case "reserved":
        return (
          <Badge 
            className="text-white" 
            style={{ backgroundColor: branding.primaryColor }}
          >
            Zarezerwowane
          </Badge>
        )
      default:
        return <Badge variant="secondary">Nieznany</Badge>
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Monitor className="h-7 w-7 text-primary" />
            Rezerwacja biurek
          </h1>
          <p className="text-muted-foreground mt-1">
            Wybierz biurko na interaktywnym planie piętra
          </p>
        </div>

        {/* Date picker and view controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: pl })
                ) : (
                  <span>Wybierz datę</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) =>
                  date < new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg w-full sm:w-auto">
            <Button
              variant={viewMode === "floorplan" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("floorplan")}
              className="rounded-r-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              Plan piętra
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: branding.secondaryColor }}
              >
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Dostępne</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Zajęte</p>
                <p className="text-2xl font-bold">{occupiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Zarezerwowane</p>
                <p className="text-2xl font-bold">{reservedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Łącznie</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === "floorplan" ? (
        /* Interactive Floor Plan View */
        <InteractiveFloorPlan
          mode="reservation"
          showReservationStatus={true}
          enableReservation={true}
          className="space-y-6"
        />
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Lista biurek</CardTitle>
            <CardDescription>
              Wszystkie biurka na piętrze {currentFloor}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentFloorDesks.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Brak biurek na tym piętrze</p>
                  <p className="text-muted-foreground">
                    Sprawdź inne piętra lub skontaktuj się z administratorem
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentFloorDesks.map((desk) => (
                    <div
                      key={desk.id}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{desk.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {desk.zone} • Pietro {desk.floor}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        {/* Equipment */}
                        <div className="hidden md:flex items-center gap-1">
                          {desk.equipment.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {desk.equipment.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{desk.equipment.length - 2}
                            </Badge>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex flex-col items-start lg:items-end gap-1">
                          {getStatusBadge(desk.status)}
                          {desk.reservedBy && (
                            <p className="text-xs text-muted-foreground">
                              {desk.reservedBy} do {desk.reservedUntil}
                            </p>
                          )}
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          disabled={desk.status !== "available"}
                          onClick={() => {
                            // Could open reservation dialog here
                            console.log("Reserve desk:", desk.id)
                          }}
                        >
                          {desk.status === "available" ? "Zarezerwuj" : "Niedostępne"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Help */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Jak zarezerwować biurko?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Znajdź biurko</p>
                <p className="text-muted-foreground">
                  Użyj planu piętra lub listy, aby znaleźć dostępne biurko
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Kliknij aby zarezerwować</p>
                <p className="text-muted-foreground">
                  Kliknij na biurko na planie lub przycisk "Zarezerwuj"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Potwierdź rezerwację</p>
                <p className="text-muted-foreground">
                  Sprawdź szczegóły i potwierdź swoją rezerwację
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}