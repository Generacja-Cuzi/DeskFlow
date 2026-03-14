// Enhanced types for unified floor plan and reservation system

export type DeskStatus = "available" | "occupied" | "reserved" | "maintenance"
export type RoomStatus = "available" | "occupied" | "reserved" | "maintenance"

export interface TimeSlot {
  time: string         // e.g., "08:00 - 09:00"
  available: boolean   // Availability status
  bookedBy?: string    // Who booked it
  meetingTitle?: string // Meeting name
}

// Enhanced FloorElement with reservation integration
export interface FloorElement {
  id: string                    // Shared ID with reservation system
  type: "desk" | "room" | "wall" | "door"
  x: number                     // Canvas X coordinate
  y: number                     // Canvas Y coordinate  
  width: number                 // Element width
  height: number                // Element height
  rotation: number              // Rotation angle in degrees
  name: string                  // Display name (e.g., "Biurko A-01")
  capacity?: number             // For desks (1) and rooms (2-50)
  equipment?: string[]          // Available equipment
  floor: number                 // Floor number (1, 2, 3, etc.)
  
  // Reservation integration properties
  status?: DeskStatus | RoomStatus
  reservedBy?: string           // Current user who reserved it
  reservedUntil?: string        // End time "HH:mm" for desks
  timeSlots?: TimeSlot[]        // For conference rooms
  zone?: string                 // Zone identifier (e.g., "Strefa A")
  description?: string          // Additional information

  // Label styling and placement
  labelFontFamily?: string
  labelFontSize?: number
  labelColor?: string
  labelOffsetX?: number
  labelOffsetY?: number
}

// Enhanced Desk type
export interface Desk {
  id: string                    // Must match FloorElement.id
  name: string                  // e.g., "Biurko A-01"
  zone: string                  // e.g., "Strefa A", "Strefa B"
  floor: number                 // Floor number
  status: DeskStatus            // Current availability
  equipment: string[]           // e.g., ["Monitor 27\"", "Stacja dokujaca"]
  reservedBy?: string           // User who reserved it
  reservedUntil?: string        // End time "HH:mm"
  
  // Floor plan integration
  floorElementId: string        // References FloorElement.id
  coordinates?: { x: number; y: number }  // Position on floor plan
}

// Enhanced ConferenceRoom type
export interface ConferenceRoom {
  id: string                    // Must match FloorElement.id
  name: string                  // e.g., "Sala Konferencyjna A"
  capacity: number              // Number of people
  floor: number                 // Floor location
  equipment: string[]           // e.g., ["Projektor", "Wideokonferencja"]
  image?: string                // Room image URL
  timeSlots: TimeSlot[]         // Available time slots
  status?: RoomStatus           // Current status
  
  // Floor plan integration
  floorElementId: string        // References FloorElement.id
  coordinates?: { x: number; y: number }  // Position on floor plan
}

// Floor plan data structure
export interface FloorPlan {
  id: string
  name: string                  // e.g., "Pietro 1", "Pietro 2"
  floorNumber: number           // 1, 2, 3, etc.
  canvasWidth?: number
  canvasHeight?: number
  elements: FloorElement[]      // All elements on this floor
  createdAt: string
  updatedAt: string
}

// Company branding settings
export interface CompanyBranding {
  id: string
  name: string
  logo?: string                 // Base64 or URL
  primaryColor: string          // Hex color
  secondaryColor: string        // Hex color
  textColor?: string            // Hex color for main text
  activeButtonTextColor?: string // Hex color for text on active/primary buttons
  description?: string
  website?: string
  address?: string
  phone?: string
}

// Reservation request types
export interface DeskReservationRequest {
  deskId: string
  userId: string
  userName: string
  startTime: string             // ISO string
  endTime: string               // ISO string
  date: string                  // YYYY-MM-DD
}

export interface RoomReservationRequest {
  roomId: string
  userId: string
  userName: string
  meetingTitle: string
  participantCount: number
  timeSlot: string              // e.g., "09:00 - 10:00"
  date: string                  // YYYY-MM-DD
  equipment?: string[]          // Requested equipment
}

// Filter and search types
export interface ReservationFilters {
  floor?: number
  status?: DeskStatus | RoomStatus
  date?: string
  searchQuery?: string
  zone?: string
  capacity?: { min?: number; max?: number }
  equipment?: string[]
}

// UI state types
export interface FloorPlanViewState {
  selectedElementId?: string
  viewMode: "overview" | "detailed"
  zoom: number
  showGrid: boolean
  showAvailableOnly: boolean
  filters: ReservationFilters
}

export interface ReservationContextType {
  // Floor plans
  floorPlans: FloorPlan[]
  currentFloor: number
  
  // Reservations
  desks: Desk[]
  rooms: ConferenceRoom[]
  
  // UI state
  viewState: FloorPlanViewState
  
  // Actions
  setCurrentFloor: (floor: number) => void
  reserveDesk: (request: DeskReservationRequest) => Promise<boolean>
  reserveRoom: (request: RoomReservationRequest) => Promise<boolean>
  cancelReservation: (id: string, type: "desk" | "room") => Promise<boolean>
  updateFilters: (filters: Partial<ReservationFilters>) => void
  selectElement: (id: string) => void
  upsertFloorPlan: (floorPlan: FloorPlan) => Promise<void>
  deleteFloorPlan: (floorId: string) => Promise<void>
}

export interface BrandingContextType {
  branding: CompanyBranding
  updateBranding: (branding: Partial<CompanyBranding>) => Promise<void>
  applyTheme: (
    primaryColor: string,
    secondaryColor: string,
    textColor?: string,
    activeButtonTextColor?: string
  ) => void
}

// Utility types for component props
export interface InteractiveFloorPlanProps {
  floorPlan: FloorPlan
  mode: "reservation" | "editing"
  selectedElementId?: string
  onElementClick?: (element: FloorElement) => void
  onElementSelect?: (element: FloorElement) => void
  showReservationStatus?: boolean
  enableReservation?: boolean
  clickableTypes?: Array<"desk" | "room">
  filters?: ReservationFilters
  availabilityByTarget?: Record<string, Array<{ startAt: string; endAt: string }>>
  selectedRange?: { startTime: string; endTime: string }
  dayRange?: { startTime: string; endTime: string }
  className?: string
  showContextLayout?: boolean
}

export interface ReservationDialogProps {
  element: FloorElement
  isOpen: boolean
  onClose: () => void
  onReserve: (request: DeskReservationRequest | RoomReservationRequest) => Promise<boolean>
}