"use client"

import React, { useRef, useState, useCallback, useMemo } from "react"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
import type Konva from "konva"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Monitor,
  MapPin,
} from "lucide-react"
import { FloorElement, InteractiveFloorPlanProps, DeskReservationRequest, RoomReservationRequest } from "@/lib/types"
import { useReservation, useCurrentFloorPlan, useFilteredElements } from "@/lib/contexts/reservation-context"
import { toast } from "@/hooks/use-toast"

interface ReservationDialogProps {
  element: FloorElement | null
  isOpen: boolean
  onClose: () => void
  onReserve: (request: DeskReservationRequest | RoomReservationRequest) => Promise<boolean>
}

function ReservationDialog({ element, isOpen, onClose, onReserve }: ReservationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [meetingTitle, setMeetingTitle] = useState("")
  const [participantCount, setParticipantCount] = useState(1)

  const handleReserve = async () => {
    if (!element) return

    setIsSubmitting(true)
    try {
      let success = false

      if (element.type === "desk") {
        const request: DeskReservationRequest = {
          deskId: element.id,
          userId: "current-user", // In real app, get from auth context
          userName: "Jan Kowalski", // In real app, get from auth context
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          date: new Date().toISOString().split("T")[0],
        }
        success = await onReserve(request)
      } else if (element.type === "room" && selectedTimeSlot) {
        const request: RoomReservationRequest = {
          roomId: element.id,
          userId: "current-user",
          userName: "Jan Kowalski",
          meetingTitle: meetingTitle || "Spotkanie",
          participantCount,
          timeSlot: selectedTimeSlot,
          date: new Date().toISOString().split("T")[0],
        }
        success = await onReserve(request)
      }

      if (!success) {
        toast({
          title: "Rezerwacja odrzucona",
          description: "Sprawdz dostepnosc i wybierz inny przedzial czasu.",
          variant: "destructive",
        })
        return
      }

      onClose()
      setMeetingTitle("")
      setSelectedTimeSlot("")
      setParticipantCount(1)
    } catch (error) {
      console.error("Reservation failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!element) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {element.type === "desk" ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            Rezerwacja: {element.name}
          </DialogTitle>
          <DialogDescription>
            {element.type === "desk" 
              ? "Zarezerwuj biurko na cały dzień roboczy"
              : "Zarezerwuj salę konferencyjną na wybrany czas"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Element details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Lokalizacja</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Pietro {element.floor} • {element.zone || "Główna"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {element.type === "desk" ? "Miejsca" : "Pojemność"}
              </p>
              <p className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {element.capacity || 1} {element.type === "desk" ? "osoba" : "osób"}
              </p>
            </div>
          </div>

          {/* Equipment */}
          {element.equipment && element.equipment.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Wyposażenie</p>
              <div className="flex flex-wrap gap-1">
                {element.equipment.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Room-specific fields */}
          {element.type === "room" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tytuł spotkania</label>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="np. Team Meeting"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Liczba uczestników</label>
                <Select
                  value={participantCount.toString()}
                  onValueChange={(value) => setParticipantCount(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: element.capacity || 1 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "osoba" : "osób"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Godzina</label>
                <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz godzinę" />
                  </SelectTrigger>
                  <SelectContent>
                    {element.timeSlots?.filter(slot => slot.available).map((slot) => (
                      <SelectItem key={slot.time} value={slot.time}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {slot.time}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Anuluj
            </Button>
            <Button
              onClick={handleReserve}
              disabled={isSubmitting || (element.type === "room" && !selectedTimeSlot)}
              className="flex-1"
            >
              {isSubmitting ? "Rezerwuję..." : "Zarezerwuj"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InteractiveFloorPlan({ 
  mode = "reservation", 
  showReservationStatus = true, 
  enableReservation = true,
  clickableTypes = ["desk", "room"],
  showContextLayout = false,
  availabilityByTarget,
  selectedRange,
  dayRange,
  onElementClick,
  className = "",
}: Partial<InteractiveFloorPlanProps>) {
  const { currentFloor, setCurrentFloor, floorPlans, reserveDesk, reserveRoom, viewState, updateFilters, selectElement } = useReservation()
  const currentFloorPlan = useCurrentFloorPlan()
  const filteredElements = useFilteredElements()
  
  const [scale, setScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(mode === "editing")
  const [selectedElement, setSelectedElement] = useState<FloorElement | null>(null)
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const stageRef = useRef<Konva.Stage>(null)

  const GRID_SIZE = 20
  const STAGE_WIDTH = currentFloorPlan?.canvasWidth ?? 1200
  const STAGE_HEIGHT = currentFloorPlan?.canvasHeight ?? 700
  const stageClassName = useMemo(
    () => "border-t bg-white overflow-auto overscroll-contain rounded-b-xl",
    []
  )

  // Handle element click
  const toMinutes = useCallback((value: string) => {
    const [hour, minute] = value.split(":").map(Number)
    return hour * 60 + minute
  }, [])

  const isOverlapping = useCallback((startA: string, endA: string, startB: string, endB: string) => {
    const aStart = toMinutes(startA)
    const aEnd = toMinutes(endA)
    const bStart = toMinutes(startB)
    const bEnd = toMinutes(endB)
    return aStart < bEnd && bStart < aEnd
  }, [toMinutes])

  const toHour = useCallback((value: string) => {
    if (!value.includes("T")) {
      return value.slice(0, 5)
    }

    return value.slice(11, 16)
  }, [])

  const busySlotToInterval = useCallback(
    (slot: { startAt: string; endAt: string }) => {
      const dayStart = dayRange?.startTime || "07:00"
      const dayEnd = dayRange?.endTime || "19:00"

      const dayStartMinutes = toMinutes(dayStart)
      const dayEndMinutes = toMinutes(dayEnd)

      const start = toMinutes(toHour(slot.startAt))
      let end = toMinutes(toHour(slot.endAt))

      if (end <= start) {
        end = dayEndMinutes
      }

      const clampedStart = Math.max(dayStartMinutes, Math.min(start, dayEndMinutes))
      const clampedEnd = Math.max(dayStartMinutes, Math.min(end, dayEndMinutes))

      if (clampedEnd <= clampedStart) {
        return null
      }

      return { start: clampedStart, end: clampedEnd }
    },
    [dayRange?.endTime, dayRange?.startTime, toHour, toMinutes]
  )

  const handleElementClick = useCallback((element: FloorElement) => {
    setSelectedElement(element)
    selectElement(element.id)

    onElementClick?.(element)
    
    if (enableReservation && (element.type === "desk" || element.type === "room")) {
      if (element.status === "available" || 
          (element.type === "room" && element.timeSlots?.some(slot => slot.available))) {
        setReservationDialogOpen(true)
      }
    }
  }, [enableReservation, onElementClick, selectElement])

  // Handle reservation
  const handleReservation = async (request: DeskReservationRequest | RoomReservationRequest) => {
    if ("deskId" in request) {
      return await reserveDesk(request)
    } else {
      return await reserveRoom(request)
    }
  }

  const handleWheelZoom = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()

    const stage = e.target.getStage()
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.06
    const oldScale = scale
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const nextScaleRaw = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const nextScale = Math.max(0.4, Math.min(3, nextScaleRaw))

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    }

    setScale(nextScale)
    setStagePosition({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    })
  }, [scale, stagePosition.x, stagePosition.y])

  // Get element color based on status and theme
  const getElementColor = (element: FloorElement) => {
    if (element.type === "wall") return "#6b7280"
    if (element.type === "door") return "#f59e0b"

    const isInteractiveType = element.type === "desk" || element.type === "room"
    const isClickableType = isInteractiveType && clickableTypes.includes(element.type)

    if (showContextLayout && isInteractiveType && !isClickableType) {
      return "#9ca3af"
    }

    if (
      selectedRange &&
      availabilityByTarget &&
      isInteractiveType
    ) {
      const busySlots = availabilityByTarget[element.id]
      if (!busySlots) {
        return "#22c55e"
      }

      const intervals = busySlots
        .map((slot) => busySlotToInterval(slot))
        .filter((slot): slot is { start: number; end: number } => Boolean(slot))
        .sort((a, b) => a.start - b.start)

      const merged: Array<{ start: number; end: number }> = []
      for (const interval of intervals) {
        if (!merged.length || interval.start > merged[merged.length - 1].end) {
          merged.push({ ...interval })
          continue
        }

        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end)
      }

      const dayStart = toMinutes(dayRange?.startTime || "07:00")
      const dayEnd = toMinutes(dayRange?.endTime || "19:00")
      const isUnavailableWholeDay =
        merged.length > 0 && merged[0].start <= dayStart && merged[merged.length - 1].end >= dayEnd

      if (isUnavailableWholeDay) {
        return "#ef4444"
      }

      const isBusyForRange = merged.some((slot) =>
        isOverlapping(
          selectedRange.startTime,
          selectedRange.endTime,
          `${String(Math.floor(slot.start / 60)).padStart(2, "0")}:${String(slot.start % 60).padStart(2, "0")}`,
          `${String(Math.floor(slot.end / 60)).padStart(2, "0")}:${String(slot.end % 60).padStart(2, "0")}`
        )
      )

      if (isBusyForRange) {
        return "#7c3aed"
      }

      return "#22c55e"
    }

    if (isInteractiveType && !isClickableType) {
      return "#9ca3af"
    }

    switch (element.status) {
      case "available":
        return "#22c55e"
      case "reserved":
        return "#7c3aed"
      case "occupied":
        return "#ef4444"
      case "maintenance":
        return "#f97316"
      default:
        return element.type === "desk" ? "#22c55e" : "#22c55e"
    }
  }

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null
    
    const lines = []
    for (let i = 0; i <= STAGE_WIDTH / GRID_SIZE; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * GRID_SIZE}
          y={0}
          width={1}
          height={STAGE_HEIGHT}
          fill="#e5e7eb"
        />
      )
    }
    for (let j = 0; j <= STAGE_HEIGHT / GRID_SIZE; j++) {
      lines.push(
        <Rect
          key={`h-${j}`}
          x={0}
          y={j * GRID_SIZE}
          width={STAGE_WIDTH}
          height={1}
          fill="#e5e7eb"
        />
      )
    }
    return lines
  }

  // Render individual element
  const renderElement = (element: FloorElement) => {
    const isSelected = element.id === viewState.selectedElementId
    const color = getElementColor(element)
    const isClickable =
      (element.type === "desk" || element.type === "room") &&
      clickableTypes.includes(element.type)

    return (
      <Group
        key={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        onClick={isClickable ? () => handleElementClick(element) : undefined}
        onTap={isClickable ? () => handleElementClick(element) : undefined}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={color}
          opacity={0.95}
          stroke={isSelected ? "#fff" : color}
          strokeWidth={isSelected ? 2.5 : 1.5}
          cornerRadius={element.type === "desk" ? 4 : element.type === "room" ? 8 : 0}
        />
        
        {/* Desk icon */}
        {element.type === "desk" && (
          <Circle 
            x={element.width / 2} 
            y={element.height / 2} 
            radius={6} 
            fill="#fff" 
            opacity={0.9} 
          />
        )}
        
        {/* Element name */}
        <Text
          text={element.name}
          x={element.labelOffsetX ?? 4}
          y={element.labelOffsetY ?? 4}
          fontSize={element.labelFontSize ?? 11}
          fontFamily={element.labelFontFamily ?? "Arial"}
          fill={element.labelColor ?? "#fff"}
          fontStyle="bold"
          width={element.width - 8}
          ellipsis
        />
        
        {/* Capacity for rooms */}
        {element.type === "room" && element.capacity && (
          <Text
            text={`👥 ${element.capacity}`}
            x={4}
            y={element.height - 16}
            fontSize={9}
            fill="#fff"
            opacity={0.9}
          />
        )}
        
        {/* Status indicator */}
        {showReservationStatus && element.status && element.status !== "available" && (
          <Text
            text={
              element.status === "occupied" ? "🔴" :
              element.status === "reserved" ? "🟡" : "⚠️"
            }
            x={element.width - 16}
            y={4}
            fontSize={10}
          />
        )}
      </Group>
    )
  }

  // Apply search filter
  React.useEffect(() => {
    updateFilters({ searchQuery })
  }, [searchQuery, updateFilters])

  React.useEffect(() => {
    if (statusFilter === "all") {
      updateFilters({ status: undefined })
    } else {
      updateFilters({ status: statusFilter as any })
    }
  }, [statusFilter, updateFilters])

  if (!currentFloorPlan) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Nie znaleziono planu piętra</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Floor selector */}
              <Select 
                value={currentFloor.toString()} 
                onValueChange={(value) => setCurrentFloor(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floorPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.floorNumber.toString()}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="available">Dostępne</SelectItem>
                  <SelectItem value="occupied">Zajęte</SelectItem>
                  <SelectItem value="reserved">Zarezerwowane</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View controls */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale(s => Math.min(2, s + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScale(1)
                  setStagePosition({ x: 0, y: 0 })
                }}
              >
                Reset widoku
              </Button>
              {mode === "editing" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? "bg-muted" : ""}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className={stageClassName}>
            <div className="min-w-full flex justify-center items-start p-2 md:p-4">
              <Stage
                ref={stageRef}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                scaleX={scale}
                scaleY={scale}
                x={stagePosition.x}
                y={stagePosition.y}
                draggable
                onDragMove={(e) => {
                  setStagePosition({ x: e.target.x(), y: e.target.y() })
                }}
                onWheel={handleWheelZoom}
              >
                <Layer>
                  <Rect x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#fafafa" />
                  {renderGrid()}
                  {(showContextLayout
                    ? filteredElements
                    : filteredElements.filter((element) => {
                        if (element.type === "wall" || element.type === "door") {
                          return true
                        }

                        return clickableTypes.includes(element.type as "desk" | "room")
                      })
                  ).map(renderElement)}
                </Layer>
              </Stage>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: "#22c55e" }} 
              />
              <span className="text-sm">Dostepne w wybranym przedziale</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: "#7c3aed" }} 
              />
              <span className="text-sm">Zarezerwowane w wybranym przedziale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm">Niedostepne caly dzien</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span className="text-sm">Elementy pogladowe (nieklikalne)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Dialog */}
      <ReservationDialog
        element={selectedElement}
        isOpen={reservationDialogOpen}
        onClose={() => setReservationDialogOpen(false)}
        onReserve={handleReservation}
      />
    </div>
  )
}