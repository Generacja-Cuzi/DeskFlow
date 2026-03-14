"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, Eye, List, Clock, Tv } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { InteractiveFloorPlan } from "@/components/interactive-floor-plan"
import { useReservation } from "@/lib/contexts/reservation-context"
import { useBranding } from "@/lib/contexts/branding-context"

export default function SalePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("09:00 - 10:00")
  const [viewMode, setViewMode] = useState<"floorplan" | "list">("floorplan")
  
  const { rooms, currentFloor } = useReservation()
  const { branding } = useBranding()

  // Filter rooms for current floor
  const currentFloorRooms = rooms.filter(room => room.floor === currentFloor)
  
  // Statistics for the selected time slot
  const availableCount = currentFloorRooms.filter(room => 
    room.timeSlots.some(slot => slot.time === selectedTime && slot.available)
  ).length
  
  const occupiedCount = currentFloorRooms.filter(room =>
    room.timeSlots.some(slot => slot.time === selectedTime && !slot.available)
  ).length
  
  const totalCount = currentFloorRooms.length

  // Common time slots
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00", 
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ]

  const getCapacityBadge = (capacity: number) => {
    if (capacity <= 4) {
      return <Badge variant="outline" className="text-xs">Mała ({capacity} os.)</Badge>
    } else if (capacity <= 10) {
      return <Badge variant="outline" className="text-xs">Średnia ({capacity} os.)</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Duża ({capacity} os.)</Badge>
    }
  }

  const getRoomStatusForTime = (room: any, timeSlot: string) => {
    const slot = room.timeSlots.find((s: any) => s.time === timeSlot)
    return slot?.available ? "available" : "occupied"
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Sale konferencyjne
          </h1>
          <p className="text-muted-foreground mt-1">
            Zarezerwuj salę konferencyjną na interaktywnym planie piętra
          </p>
        </div>

        {/* Date, Time and View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[220px] justify-start text-left font-normal",
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

          {/* Time slot selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[180px] justify-start">
                <Clock className="mr-2 h-4 w-4" />
                {selectedTime}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2">
                <div className="grid gap-1">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTime(slot)}
                      className="justify-start"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: branding.secondaryColor }}
              >
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Dostępne ({selectedTime})
                </p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Zajęte ({selectedTime})
                </p>
                <p className="text-2xl font-bold">{occupiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Łącznie sal</p>
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
            <CardTitle>Lista sal konferencyjnych</CardTitle>
            <CardDescription>
              Wszystkie sale na piętrze {currentFloor} - {selectedTime}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentFloorRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Brak sal na tym piętrze</p>
                  <p className="text-muted-foreground">
                    Sprawdź inne piętra lub skontaktuj się z administratorem
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {currentFloorRooms.map((room) => {
                    const isAvailable = getRoomStatusForTime(room, selectedTime) === "available"
                    const timeSlot = room.timeSlots.find(s => s.time === selectedTime)
                    
                    return (
                      <div
                        key={room.id}
                        className={cn(
                          "border rounded-lg p-6 transition-colors",
                          isAvailable ? "hover:bg-muted/50" : "bg-muted/20"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-2 min-w-0">
                              <div>
                                <h3 className="text-lg font-semibold truncate">{room.name}</h3>
                                <p className="text-muted-foreground">
                                  Pietro {room.floor} • {selectedTime}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {getCapacityBadge(room.capacity)}
                                <Badge
                                  className="text-white"
                                  style={{ 
                                    backgroundColor: isAvailable ? branding.secondaryColor : "#ef4444"
                                  }}
                                >
                                  {isAvailable ? "Dostępna" : "Zajęta"}
                                </Badge>
                              </div>

                              {/* Equipment */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {room.equipment.slice(0, 3).map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                                {room.equipment.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{room.equipment.length - 3}
                                  </Badge>
                                )}
                              </div>

                              {/* Booking info */}
                              {!isAvailable && timeSlot?.bookedBy && (
                                <p className="text-sm text-muted-foreground">
                                  Zarezerwowane przez: {timeSlot.bookedBy}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                            {/* Time slots preview */}
                            <div className="hidden lg:flex items-center gap-1">
                              {room.timeSlots.slice(0, 5).map((slot, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    "h-6 w-6 rounded text-xs flex items-center justify-center font-medium",
                                    slot.available
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700",
                                    slot.time === selectedTime && "ring-2 ring-primary"
                                  )}
                                >
                                  {slot.available ? "✓" : "✗"}
                                </div>
                              ))}
                            </div>

                            <Button
                              disabled={!isAvailable}
                              onClick={() => {
                                // Could open reservation dialog here
                                console.log("Reserve room:", room.id, selectedTime)
                              }}
                            >
                              {isAvailable ? "Zarezerwuj" : "Zajęta"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dostępność sal - cały dzień
          </CardTitle>
          <CardDescription>
            Szybki podgląd dostępności wszystkich sal w ciągu dnia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentFloorRooms.map((room) => (
              <div key={room.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{room.name}</h4>
                    {getCapacityBadge(room.capacity)}
                  </div>
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {room.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-8 rounded text-xs flex items-center justify-center font-medium cursor-pointer transition-colors",
                        slot.available
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700",
                        slot.time === selectedTime && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedTime(slot.time)}
                      title={slot.available ? `${slot.time} - Dostępna` : `${slot.time} - ${slot.bookedBy}`}
                    >
                      {slot.time.split(" - ")[0].substring(0, 5)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-100 rounded" />
              <span className="text-sm">Dostępne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-red-100 rounded" />
              <span className="text-sm">Zajęte</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary rounded" />
              <span className="text-sm">Wybrany czas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Help */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Jak zarezerwować salę konferencyjną?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Wybierz datę i godzinę</p>
                <p className="text-muted-foreground">
                  Ustaw datę spotkania i preferowaną godzinę
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Znajdź dostępną salę</p>
                <p className="text-muted-foreground">
                  Sprawdź plan piętra lub listę sal pod kątem pojemności i wyposażenia
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Zarezerwuj salę</p>
                <p className="text-muted-foreground">
                  Kliknij na salę na planie lub przycisk "Zarezerwuj"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}