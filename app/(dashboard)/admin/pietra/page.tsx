"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { useReservation } from "@/lib/contexts/reservation-context"
import type { FloorPlan } from "@/lib/types"

const FloorPlanEditor = dynamic(
  () => import("@/components/floor-plan-editor").then((mod) => mod.FloorPlanEditor),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">Ladowanie edytora...</div> }
)

export default function FloorManagementPage() {
  const { floorPlans, upsertFloorPlan, deleteFloorPlan } = useReservation()
  const [editingFloor, setEditingFloor] = useState<FloorPlan | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [newFloorName, setNewFloorName] = useState("")
  const [newFloorWidth, setNewFloorWidth] = useState(1200)
  const [newFloorHeight, setNewFloorHeight] = useState(800)
  const [isNewFloorDialogOpen, setIsNewFloorDialogOpen] = useState(false)

  const floors = useMemo(
    () => floorPlans.map((floor) => ({
      ...floor,
      desksCount: floor.elements.filter((e) => e.type === "desk").length,
      roomsCount: floor.elements.filter((e) => e.type === "room").length,
    })),
    [floorPlans]
  )

  const handleSaveFloor = async (
    elements: FloorElement[],
    floorName: string,
    canvasSize: { width: number; height: number }
  ) => {
    if (!editingFloor) return

    await upsertFloorPlan({
      ...editingFloor,
      name: floorName,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      elements: elements as any,
      updatedAt: new Date().toISOString(),
    })

    setIsEditorOpen(false)
    setEditingFloor(null)
  }

  const handleCreateFloor = async () => {
    if (!newFloorName.trim()) return

    const maxFloor = Math.max(0, ...floorPlans.map((f) => f.floorNumber))
    const newFloor: FloorPlan = {
      id: `floor-${Date.now()}`,
      name: newFloorName,
      floorNumber: maxFloor + 1,
      elements: [],
      canvasWidth: Math.max(400, newFloorWidth),
      canvasHeight: Math.max(300, newFloorHeight),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await upsertFloorPlan(newFloor)
    setNewFloorName("")
    setNewFloorWidth(1200)
    setNewFloorHeight(800)
    setIsNewFloorDialogOpen(false)
    setEditingFloor(newFloor)
    setIsEditorOpen(true)
  }

  const handleDeleteFloor = async (floorId: string) => {
    await deleteFloorPlan(floorId)
  }

  const handleEditFloor = (floor: FloorPlan) => {
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
          initialElements={editingFloor.elements as any}
          floorName={editingFloor.name}
          initialCanvasSize={{ width: editingFloor.canvasWidth || 1200, height: editingFloor.canvasHeight || 800 }}
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
