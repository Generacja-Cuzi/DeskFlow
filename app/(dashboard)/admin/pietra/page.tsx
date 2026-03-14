"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Layers,
  Edit,
  Trash2,
  Building2,
  Monitor,
  Users,
} from "lucide-react"
import type { FloorElement } from "@/components/floor-plan-editor"

const FloorPlanEditor = dynamic(
  () => import("@/components/floor-plan-editor").then((mod) => mod.FloorPlanEditor),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">Ladowanie edytora...</div> }
)

type Floor = {
  id: string
  name: string
  elements: FloorElement[]
  canvasWidth: number
  canvasHeight: number
  desksCount: number
  roomsCount: number
}

const initialFloors: Floor[] = [
  {
    id: "floor-1",
    name: "Pietro 1 - Open Space",
    canvasWidth: 1400,
    canvasHeight: 900,
    elements: [
      { id: "desk-1", type: "desk", x: 100, y: 100, width: 80, height: 60, rotation: 0, name: "Biurko A-1", capacity: 1 },
      { id: "desk-2", type: "desk", x: 200, y: 100, width: 80, height: 60, rotation: 0, name: "Biurko A-2", capacity: 1 },
      { id: "desk-3", type: "desk", x: 300, y: 100, width: 80, height: 60, rotation: 0, name: "Biurko A-3", capacity: 1 },
      { id: "room-1", type: "room", x: 500, y: 80, width: 200, height: 150, rotation: 0, name: "Sala Alfa", capacity: 8 },
    ],
    desksCount: 3,
    roomsCount: 1,
  },
  {
    id: "floor-2",
    name: "Pietro 2 - Zespoly",
    canvasWidth: 1200,
    canvasHeight: 800,
    elements: [
      { id: "desk-4", type: "desk", x: 100, y: 100, width: 80, height: 60, rotation: 0, name: "Biurko B-1", capacity: 1 },
      { id: "room-2", type: "room", x: 300, y: 100, width: 180, height: 120, rotation: 0, name: "Sala Beta", capacity: 6 },
      { id: "room-3", type: "room", x: 500, y: 100, width: 160, height: 100, rotation: 0, name: "Sala Gamma", capacity: 4 },
    ],
    desksCount: 1,
    roomsCount: 2,
  },
]

export default function FloorManagementPage() {
  const [floors, setFloors] = useState<Floor[]>(initialFloors)
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [newFloorName, setNewFloorName] = useState("")
  const [newFloorWidth, setNewFloorWidth] = useState(1200)
  const [newFloorHeight, setNewFloorHeight] = useState(800)
  const [isNewFloorDialogOpen, setIsNewFloorDialogOpen] = useState(false)

  const handleSaveFloor = (
    elements: FloorElement[],
    floorName: string,
    canvasSize: { width: number; height: number }
  ) => {
    if (editingFloor) {
      setFloors(floors.map(f => 
        f.id === editingFloor.id 
          ? {
              ...f,
              name: floorName,
              elements,
              canvasWidth: canvasSize.width,
              canvasHeight: canvasSize.height,
              desksCount: elements.filter(e => e.type === "desk").length,
              roomsCount: elements.filter(e => e.type === "room").length,
            }
          : f
      ))
    }
    setIsEditorOpen(false)
    setEditingFloor(null)
  }

  const handleCreateFloor = () => {
    if (!newFloorName.trim()) return
    
    const newFloor: Floor = {
      id: `floor-${Date.now()}`,
      name: newFloorName,
      elements: [],
      canvasWidth: Math.max(400, newFloorWidth),
      canvasHeight: Math.max(300, newFloorHeight),
      desksCount: 0,
      roomsCount: 0,
    }
    setFloors([...floors, newFloor])
    setNewFloorName("")
    setNewFloorWidth(1200)
    setNewFloorHeight(800)
    setIsNewFloorDialogOpen(false)
    setEditingFloor(newFloor)
    setIsEditorOpen(true)
  }

  const handleDeleteFloor = (floorId: string) => {
    setFloors(floors.filter(f => f.id !== floorId))
  }

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor)
    setIsEditorOpen(true)
  }

  if (isEditorOpen && editingFloor) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Edytor pietra</h1>
            <p className="text-muted-foreground">Rysuj biurka i sale konferencyjne</p>
          </div>
          <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
            Powrot do listy
          </Button>
        </div>
        <FloorPlanEditor
          initialElements={editingFloor.elements}
          floorName={editingFloor.name}
          initialCanvasSize={{ width: editingFloor.canvasWidth, height: editingFloor.canvasHeight }}
          onSave={handleSaveFloor}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            Zarzadzanie pietrami
          </h1>
          <p className="text-muted-foreground mt-1">
            Projektuj uklad biura, dodawaj biurka i sale konferencyjne
          </p>
        </div>
        <Dialog open={isNewFloorDialogOpen} onOpenChange={setIsNewFloorDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj pietro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowe pietro</DialogTitle>
              <DialogDescription>
                Wprowadz nazwe pietra, a nastepnie zaprojektuj jego uklad
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nazwa pietra</Label>
                <Input
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  placeholder="np. Pietro 3 - Marketing"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Szerokosc planszy</Label>
                  <Input
                    type="number"
                    value={newFloorWidth}
                    onChange={(e) => setNewFloorWidth(Math.max(400, Number(e.target.value) || 400))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wysokosc planszy</Label>
                  <Input
                    type="number"
                    value={newFloorHeight}
                    onChange={(e) => setNewFloorHeight(Math.max(300, Number(e.target.value) || 300))}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreateFloor}>
                Utworz i edytuj
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {floors.map((floor) => (
          <Card key={floor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{floor.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {floor.elements.length} elementow • {floor.canvasWidth}x{floor.canvasHeight}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{floor.desksCount} biurek</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">{floor.roomsCount} sal</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => handleEditFloor(floor)}
                >
                  <Edit className="h-4 w-4" />
                  Edytuj
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteFloor(floor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsNewFloorDialogOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <Plus className="h-10 w-10 mb-2" />
            <p className="font-medium">Dodaj nowe pietro</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
