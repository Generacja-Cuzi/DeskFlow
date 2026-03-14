"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Building2, CalendarIcon, Clock, Monitor } from "lucide-react"

import { InteractiveFloorPlan } from "@/components/interactive-floor-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReservation } from "@/lib/contexts/reservation-context"
import type { FloorElement } from "@/lib/types"
import { cn } from "@/lib/utils"

type BusySlot = {
  startAt: string
  endAt: string
  userName: string | null
}

type DeskReservationDraft = {
  deskId: string
  name: string
  zone?: string
  floor: number
  busySlots: BusySlot[]
}

const DAY_START = "07:00"
const DAY_END = "19:00"

const timeOptions = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  const minute = String(totalMinutes % 60).padStart(2, "0")
  return `${hour}:${minute}`
})

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function fromMinutes(totalMinutes: number) {
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  const minute = String(totalMinutes % 60).padStart(2, "0")
  return `${hour}:${minute}`
}

function toHourLabel(value: string) {
  if (!value.includes("T")) {
    return value.slice(0, 5)
  }

  return value.slice(11, 16)
}

function busySlotToInterval(slot: BusySlot, dayStart: string, dayEnd: string) {
  const dayStartMinutes = toMinutes(dayStart)
  const dayEndMinutes = toMinutes(dayEnd)

  const startLabel = toHourLabel(slot.startAt)
  const endLabel = toHourLabel(slot.endAt)

  const start = toMinutes(startLabel)
  let end = toMinutes(endLabel)

  // Handle legacy records that span into next day but are stored under one date.
  if (end <= start) {
    end = dayEndMinutes
  }

  const clampedStart = Math.max(dayStartMinutes, Math.min(start, dayEndMinutes))
  const clampedEnd = Math.max(dayStartMinutes, Math.min(end, dayEndMinutes))

  if (clampedEnd <= clampedStart) {
    return null
  }

  return { start: clampedStart, end: clampedEnd }
}

function isOverlapping(startA: string, endA: string, startB: string, endB: string) {
  const aStart = toMinutes(startA)
  const aEnd = toMinutes(endA)
  const bStart = toMinutes(startB)
  const bEnd = toMinutes(endB)
  return aStart < bEnd && bStart < aEnd
}

function getFreeIntervals(busySlots: BusySlot[]) {
  const sorted = [...busySlots]
    .map((slot) => busySlotToInterval(slot, DAY_START, DAY_END))
    .filter((slot): slot is { start: number; end: number } => Boolean(slot))
    .sort((a, b) => a.start - b.start)

  const merged: Array<{ start: number; end: number }> = []

  for (const slot of sorted) {
    if (!merged.length || slot.start > merged[merged.length - 1].end) {
      merged.push({ ...slot })
      continue
    }

    merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, slot.end)
  }

  const free: Array<{ start: string; end: string }> = []
  const dayStartMinutes = toMinutes(DAY_START)
  const dayEndMinutes = toMinutes(DAY_END)

  let cursor = dayStartMinutes

  for (const slot of merged) {
    if (slot.start > cursor) {
      free.push({ start: fromMinutes(cursor), end: fromMinutes(slot.start) })
    }

    cursor = Math.max(cursor, slot.end)
  }

  if (cursor < dayEndMinutes) {
    free.push({ start: fromMinutes(cursor), end: fromMinutes(dayEndMinutes) })
  }

  return free.filter((interval) => toMinutes(interval.end) - toMinutes(interval.start) >= 30)
}

export default function BiurkaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [availability, setAvailability] = useState<Record<string, BusySlot[]>>({})
  const [submittingDeskId, setSubmittingDeskId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reservationDraft, setReservationDraft] = useState<DeskReservationDraft | null>(null)
  const [viewMode, setViewMode] = useState("map")

  const { desks, currentFloor, floorPlans, setCurrentFloor } = useReservation()

  const selectedDateString = useMemo(() => toDateString(selectedDate), [selectedDate])

  const currentFloorDesks = useMemo(
    () => desks.filter((desk) => desk.floor === currentFloor),
    [desks, currentFloor]
  )

  const hasInvalidRange = toMinutes(endTime) <= toMinutes(startTime)

  const loadAvailability = async () => {
    const response = await fetch(`/api/reservations/availability?type=desk&date=${selectedDateString}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      setAvailability({})
      return
    }

    const payload = await response.json()
    setAvailability(payload.targets || {})
  }

  useEffect(() => {
    loadAvailability()
  }, [selectedDateString])

  const deskState = currentFloorDesks.map((desk) => {
    const slots = availability[desk.id] || []
    const busyIntervals = slots
      .map((slot) => {
        const interval = busySlotToInterval(slot, DAY_START, DAY_END)
        if (!interval) {
          return null
        }

        return {
          start: fromMinutes(interval.start),
          end: fromMinutes(interval.end),
          userName: slot.userName,
        }
      })
      .filter((slot): slot is { start: string; end: string; userName: string | null } => Boolean(slot))

    const requestedIntervalIsBusy = busyIntervals.some((slot) =>
      isOverlapping(startTime, endTime, slot.start, slot.end)
    )

    return {
      desk,
      busyIntervals,
      busySlots: slots,
      isAvailableForSelectedRange: !requestedIntervalIsBusy,
    }
  })

  const availableCount = deskState.filter((item) => item.isAvailableForSelectedRange).length
  const occupiedCount = deskState.length - availableCount

  const openDeskDialog = (deskId: string) => {
    const desk = currentFloorDesks.find((item) => item.id === deskId)
    if (!desk) {
      return
    }

    setReservationDraft({
      deskId,
      name: desk.name,
      zone: desk.zone,
      floor: desk.floor,
      busySlots: availability[deskId] || [],
    })
    setDialogOpen(true)
  }

  const handleMapElementClick = (element: FloorElement) => {
    if (element.type !== "desk") {
      return
    }

    openDeskDialog(element.id)
  }

  const reserveDesk = async (deskId: string, rangeStart = startTime, rangeEnd = endTime) => {
    if (toMinutes(rangeEnd) <= toMinutes(rangeStart)) {
      return
    }

    setSubmittingDeskId(deskId)

    const response = await fetch("/api/reservations/desk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deskId,
        date: selectedDateString,
        startTime: rangeStart,
        endTime: rangeEnd,
      }),
    })

    setSubmittingDeskId(null)

    if (response.ok) {
      setDialogOpen(false)
      await loadAvailability()
    }
  }

  const freeIntervals = useMemo(() => {
    if (!reservationDraft) {
      return []
    }

    return getFreeIntervals(reservationDraft.busySlots)
  }, [reservationDraft])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Monitor className="h-7 w-7 text-primary" />
            Rezerwacja biurek
          </h1>
          <p className="text-muted-foreground mt-1">
            Rezerwuj biurka z mapy albo z listy. Klikniecie zajetego biurka pozwala wybrac pierwszy wolny przedzial.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={String(currentFloor)} onValueChange={(value) => setCurrentFloor(Number(value))}>
            <SelectTrigger className="w-[170px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {floorPlans.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.floorNumber)}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[220px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP", { locale: pl })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="w-[130px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="w-[130px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasInvalidRange && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            Godzina konca musi byc pozniejsza niz godzina startu.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dostepne w wybranym zakresie</p>
            <p className="text-2xl font-bold mt-1">{availableCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Zajete w wybranym zakresie</p>
            <p className="text-2xl font-bold mt-1">{occupiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lacznie biurek na pietrze</p>
            <p className="text-2xl font-bold mt-1">{deskState.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="map">Mapa</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <InteractiveFloorPlan
            mode="reservation"
            enableReservation={false}
            clickableTypes={["desk"]}
            showContextLayout
            availabilityByTarget={availability}
            selectedRange={{ startTime, endTime }}
            dayRange={{ startTime: DAY_START, endTime: DAY_END }}
            onElementClick={handleMapElementClick}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dostepnosc biurek</CardTitle>
              <CardDescription>
                Zakres: {startTime} - {endTime}, {format(selectedDate, "d MMMM yyyy", { locale: pl })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deskState.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">Brak biurek na tym pietrze.</div>
              )}

              {deskState.map(({ desk, busyIntervals, isAvailableForSelectedRange }) => (
                <div key={desk.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{desk.name}</h3>
                      <p className="text-sm text-muted-foreground">{desk.zone} • Pietro {desk.floor}</p>
                    </div>

                    <Badge variant={isAvailableForSelectedRange ? "default" : "secondary"}>
                      {isAvailableForSelectedRange ? "Dostepne" : "Zajete w wybranym czasie"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {busyIntervals.length === 0 && (
                      <Badge variant="outline">Brak rezerwacji w tym dniu</Badge>
                    )}
                    {busyIntervals.map((slot, index) => (
                      <Badge key={`${desk.id}-${index}`} variant="outline">
                        {slot.start} - {slot.end}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => (isAvailableForSelectedRange ? reserveDesk(desk.id) : openDeskDialog(desk.id))}
                      disabled={hasInvalidRange || submittingDeskId === desk.id}
                    >
                      {submittingDeskId === desk.id
                        ? "Rezerwowanie..."
                        : isAvailableForSelectedRange
                          ? "Zarezerwuj biurko"
                          : "Rezerwuj po zwolnieniu"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wybierz godziny rezerwacji</DialogTitle>
            <DialogDescription>
              {reservationDraft
                ? `${reservationDraft.name} • Pietro ${reservationDraft.floor}${reservationDraft.zone ? ` • ${reservationDraft.zone}` : ""}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Zajete przedzialy</p>
              <div className="flex flex-wrap gap-2">
                {!reservationDraft || reservationDraft.busySlots.length === 0 ? (
                  <Badge variant="outline">Brak rezerwacji</Badge>
                ) : (
                  reservationDraft.busySlots
                    .sort((a, b) => a.startAt.localeCompare(b.startAt))
                    .map((slot, index) => {
                      const interval = busySlotToInterval(slot, DAY_START, DAY_END)
                      if (!interval) {
                        return null
                      }

                      return (
                        <Badge key={`${slot.startAt}-${index}`} variant="secondary">
                          {fromMinutes(interval.start)} - {fromMinutes(interval.end)}
                        </Badge>
                      )
                    })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Wolne przedzialy (kliknij aby ustawic)</p>
              <div className="flex flex-wrap gap-2">
                {freeIntervals.length === 0 ? (
                  <Badge variant="outline">Brak wolnych przedzialow</Badge>
                ) : (
                  freeIntervals.map((interval, index) => (
                    <Button
                      key={`${interval.start}-${interval.end}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartTime(interval.start)
                        setEndTime(interval.end)
                      }}
                    >
                      {interval.start} - {interval.end}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Start</p>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Koniec</p>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zamknij
            </Button>
            <Button
              disabled={
                !reservationDraft ||
                hasInvalidRange ||
                (reservationDraft
                  ? reservationDraft.busySlots.some((slot) => {
                      const interval = busySlotToInterval(slot, DAY_START, DAY_END)
                      if (!interval) {
                        return false
                      }

                      return isOverlapping(
                        startTime,
                        endTime,
                        fromMinutes(interval.start),
                        fromMinutes(interval.end)
                      )
                    })
                  : true)
              }
              onClick={() => reservationDraft && reserveDesk(reservationDraft.deskId, startTime, endTime)}
            >
              Zarezerwuj biurko
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
