"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"
import { FloorPlan, Desk, ConferenceRoom, ReservationContextType, ReservationFilters, FloorPlanViewState, DeskReservationRequest, RoomReservationRequest } from "@/lib/types"

const ReservationContext = createContext<ReservationContextType | null>(null)

interface ReservationProviderProps {
  children: ReactNode
}

export function ReservationProvider({ children }: ReservationProviderProps) {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([])
  const [currentFloor, setCurrentFloor] = useState<number>(1)
  const [viewState, setViewState] = useState<FloorPlanViewState>({
    viewMode: "overview",
    zoom: 1,
    showGrid: true,
    showAvailableOnly: false,
    filters: {},
  })

  // Derived data from floor plans
  const desks: Desk[] = floorPlans
    .flatMap(floor => floor.elements)
    .filter(element => element.type === "desk")
    .map(element => ({
      id: element.id,
      name: element.name,
      zone: element.zone || "Nieznana strefa",
      floor: element.floor,
      status: element.status as any || "available",
      equipment: element.equipment || [],
      reservedBy: element.reservedBy,
      reservedUntil: element.reservedUntil,
      floorElementId: element.id,
      coordinates: { x: element.x, y: element.y },
    }))

  const rooms: ConferenceRoom[] = floorPlans
    .flatMap(floor => floor.elements)
    .filter(element => element.type === "room")
    .map(element => ({
      id: element.id,
      name: element.name,
      capacity: element.capacity || 1,
      floor: element.floor,
      equipment: element.equipment || [],
      timeSlots: element.timeSlots || [],
      status: element.status as any,
      floorElementId: element.id,
      coordinates: { x: element.x, y: element.y },
    }))

  const refreshFloorPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/floor-plans", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json()) as FloorPlan[]
      setFloorPlans(data)
      if (data.length && !data.find((plan) => plan.floorNumber === currentFloor)) {
        setCurrentFloor(data[0].floorNumber)
      }
    } catch (error) {
      console.error("Error loading floor plans:", error)
    }
  }, [currentFloor])

  // Reserve a desk
  const reserveDesk = useCallback(async (request: DeskReservationRequest): Promise<boolean> => {
    try {
      const response = await fetch("/api/reservations/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        return false
      }

      await refreshFloorPlans()
      return true
    } catch (error) {
      console.error("Error reserving desk:", error)
      return false
    }
  }, [refreshFloorPlans])

  // Reserve a room
  const reserveRoom = useCallback(async (request: RoomReservationRequest): Promise<boolean> => {
    try {
      const response = await fetch("/api/reservations/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        return false
      }

      await refreshFloorPlans()
      return true
    } catch (error) {
      console.error("Error reserving room:", error)
      return false
    }
  }, [refreshFloorPlans])

  // Cancel a reservation
  const cancelReservation = useCallback(async (id: string, type: "desk" | "room"): Promise<boolean> => {
    try {
      const response = await fetch("/api/reservations/cancel-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: id, type }),
      })

      if (!response.ok) {
        return false
      }

      await refreshFloorPlans()
      return true
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      return false
    }
  }, [refreshFloorPlans])

  // Update filters
  const updateFilters = useCallback((filters: Partial<ReservationFilters>) => {
    setViewState(prev => {
      const nextFilters = { ...prev.filters, ...filters }

      // Avoid unnecessary state writes when filter values did not change.
      const hasChanges = Object.keys(filters).some((key) => {
        const typedKey = key as keyof ReservationFilters
        return prev.filters[typedKey] !== nextFilters[typedKey]
      })

      if (!hasChanges) {
        return prev
      }

      return {
        ...prev,
        filters: nextFilters,
      }
    })
  }, [])

  // Select an element
  const selectElement = useCallback((id: string) => {
    setViewState(prev => {
      if (prev.selectedElementId === id) {
        return prev
      }

      return {
        ...prev,
        selectedElementId: id,
      }
    })
  }, [])

  const upsertFloorPlan = useCallback(async (floorPlan: FloorPlan) => {
    await fetch("/api/floor-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(floorPlan),
    })
    await refreshFloorPlans()
  }, [refreshFloorPlans])

  const deleteFloorPlan = useCallback(async (floorId: string) => {
    await fetch(`/api/floor-plans/${floorId}`, {
      method: "DELETE",
    })
    await refreshFloorPlans()
  }, [refreshFloorPlans])

  useEffect(() => {
    refreshFloorPlans()
  }, [refreshFloorPlans])

  const contextValue: ReservationContextType = useMemo(() => ({
    floorPlans,
    currentFloor,
    desks,
    rooms,
    viewState,
    setCurrentFloor,
    reserveDesk,
    reserveRoom,
    cancelReservation,
    updateFilters,
    selectElement,
    upsertFloorPlan,
    deleteFloorPlan,
  }), [
    floorPlans,
    currentFloor,
    desks,
    rooms,
    viewState,
    reserveDesk,
    reserveRoom,
    cancelReservation,
    updateFilters,
    selectElement,
    upsertFloorPlan,
    deleteFloorPlan,
  ])

  return (
    <ReservationContext.Provider value={contextValue}>
      {children}
    </ReservationContext.Provider>
  )
}

export function useReservation() {
  const context = useContext(ReservationContext)
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider')
  }
  return context
}

// Helper hooks
export function useCurrentFloorPlan() {
  const { floorPlans, currentFloor } = useReservation()
  return floorPlans.find(plan => plan.floorNumber === currentFloor)
}

export function useFilteredElements() {
  const { floorPlans, currentFloor, viewState } = useReservation()
  const currentPlan = floorPlans.find(plan => plan.floorNumber === currentFloor)
  
  if (!currentPlan) return []
  
  const { filters } = viewState
  
  return currentPlan.elements.filter(element => {
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      if (!element.name.toLowerCase().includes(query) && 
          !element.zone?.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // Filter by status
    if (filters.status && element.status !== filters.status) {
      return false
    }
    
    // Filter by zone
    if (filters.zone && element.zone !== filters.zone) {
      return false
    }
    
    // Filter by capacity
    if (filters.capacity) {
      if (filters.capacity.min && (!element.capacity || element.capacity < filters.capacity.min)) {
        return false
      }
      if (filters.capacity.max && (!element.capacity || element.capacity > filters.capacity.max)) {
        return false
      }
    }
    
    // Show only available if filter is set
    if (viewState.showAvailableOnly && element.status !== "available") {
      return false
    }
    
    return true
  })
}