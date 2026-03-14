"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Stage, Layer, Rect, Circle, Text, Group, Line, Transformer } from "react-konva"
import type Konva from "konva"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Monitor,
  Users,
  Square,
  MousePointer,
  Trash2,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
} from "lucide-react"

export type FloorElement = {
  id: string
  type: "desk" | "room" | "wall" | "door"
  x: number
  y: number
  width: number
  height: number
  rotation: number
  name: string
  capacity?: number
  equipment?: string[]
  zone?: string
  labelFontFamily?: string
  labelFontSize?: number
  labelColor?: string
  labelOffsetX?: number
  labelOffsetY?: number
}

type Tool = "select" | "desk" | "room" | "wall" | "door"

interface FloorPlanEditorProps {
  initialElements?: FloorElement[]
  floorName?: string
  initialCanvasSize?: { width: number; height: number }
  onSave?: (
    elements: FloorElement[],
    floorName: string,
    canvasSize: { width: number; height: number }
  ) => void
}

export function FloorPlanEditor({
  initialElements = [],
  floorName: initialFloorName = "Pietro 1",
  initialCanvasSize,
  onSave,
}: FloorPlanEditorProps) {
  const [elements, setElements] = useState<FloorElement[]>(initialElements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [scale, setScale] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [floorName, setFloorName] = useState(initialFloorName)
  const [canvasWidth, setCanvasWidth] = useState(initialCanvasSize?.width ?? 1200)
  const [canvasHeight, setCanvasHeight] = useState(initialCanvasSize?.height ?? 800)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const shapeRefs = useRef<Record<string, Konva.Group | null>>({})

  const GRID_SIZE = 20

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      if (e.target === stage && tool === "select") {
        setSelectedId(null)
        return
      }

      if (tool === "select") {
        return
      }

      const snappedX = snapToGrid(pos.x / scale)
      const snappedY = snapToGrid(pos.y / scale)

      const defaultSizes: Record<Tool, { width: number; height: number }> = {
        select: { width: 0, height: 0 },
        desk: { width: 80, height: 60 },
        room: { width: 220, height: 150 },
        wall: { width: 140, height: 10 },
        door: { width: 70, height: 10 },
      }

      const newElement: FloorElement = {
        id: generateId(),
        type: tool,
        x: snappedX,
        y: snappedY,
        width: defaultSizes[tool].width,
        height: defaultSizes[tool].height,
        rotation: 0,
        name:
          tool === "desk"
            ? `Biurko ${elements.filter((el) => el.type === "desk").length + 1}`
            : tool === "room"
              ? `Sala ${elements.filter((el) => el.type === "room").length + 1}`
              : `${tool} ${elements.length + 1}`,
        capacity: tool === "room" ? 8 : tool === "desk" ? 1 : undefined,
        labelFontFamily: "Arial",
        labelFontSize: 12,
        labelColor: "#ffffff",
        labelOffsetX: 6,
        labelOffsetY: 6,
      }

      setElements((prev) => [...prev, newElement])
      setSelectedId(newElement.id)
      setTool("select")
    },
    [tool, elements, scale]
  )

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              x: snapToGrid(node.x()),
              y: snapToGrid(node.y()),
            }
          : el
      )
    )
  }, [])

  const handleTransformEnd = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    node.scaleX(1)
    node.scaleY(1)

    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              x: snapToGrid(node.x()),
              y: snapToGrid(node.y()),
              width: snapToGrid(Math.max(GRID_SIZE, el.width * scaleX)),
              height: snapToGrid(Math.max(GRID_SIZE, el.height * scaleY)),
              rotation: Math.round(node.rotation()),
            }
          : el
      )
    )
  }, [])

  const deleteSelected = () => {
    if (!selectedId) return
    setElements((prev) => prev.filter((el) => el.id !== selectedId))
    setSelectedId(null)
  }

  const updateSelectedElement = (updates: Partial<FloorElement>) => {
    if (!selectedId) return

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el

        const nextWidth = updates.width !== undefined ? Math.max(GRID_SIZE, updates.width) : el.width
        const nextHeight = updates.height !== undefined ? Math.max(GRID_SIZE, updates.height) : el.height

        return {
          ...el,
          ...updates,
          width: nextWidth,
          height: nextHeight,
        }
      })
    )
  }

  const selectedElement = elements.find((el) => el.id === selectedId)

  const handleSave = () => {
    onSave?.(elements, floorName, { width: canvasWidth, height: canvasHeight })
  }

  const exportFloorPlan = () => {
    const data = JSON.stringify(
      {
        floorName,
        canvasSize: { width: canvasWidth, height: canvasHeight },
        elements,
      },
      null,
      2
    )
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${floorName.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!transformerRef.current) return

    if (!selectedId) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
      return
    }

    const selectedNode = shapeRefs.current[selectedId]
    if (!selectedNode) return

    transformerRef.current.nodes([selectedNode])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId, elements])

  const getElementColor = (type: FloorElement["type"]) => {
    switch (type) {
      case "desk":
        return "#3b82f6"
      case "room":
        return "#10b981"
      case "wall":
        return "#6b7280"
      case "door":
        return "#f59e0b"
      default:
        return "#9ca3af"
    }
  }

  const renderElement = (element: FloorElement) => {
    const isSelected = element.id === selectedId
    const color = getElementColor(element.type)

    return (
      <Group
        ref={(node) => {
          shapeRefs.current[element.id] = node
        }}
        key={element.id}
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable
        onClick={() => setSelectedId(element.id)}
        onTap={() => setSelectedId(element.id)}
        onDragEnd={(e) => handleDragEnd(element.id, e)}
        onTransformEnd={(e) => handleTransformEnd(element.id, e)}
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={color}
          opacity={0.85}
          stroke={isSelected ? "#ffffff" : color}
          strokeWidth={isSelected ? 3 : 1}
          cornerRadius={element.type === "desk" ? 4 : element.type === "room" ? 8 : 0}
        />
        {element.type === "desk" && (
          <Circle x={element.width / 2} y={element.height / 2} radius={8} fill="#fff" opacity={0.9} />
        )}
        <Text
          text={element.name}
          x={element.labelOffsetX ?? 6}
          y={element.labelOffsetY ?? 6}
          fontSize={element.labelFontSize ?? 12}
          fontFamily={element.labelFontFamily ?? "Arial"}
          fill={element.labelColor ?? "#fff"}
          fontStyle="bold"
          width={Math.max(20, element.width - 12)}
          ellipsis
        />
        {element.type === "room" && element.capacity && (
          <Text
            text={`${element.capacity} os.`}
            x={6}
            y={Math.max(6, element.height - 18)}
            fontSize={11}
            fill="#fff"
            opacity={0.9}
          />
        )}
      </Group>
    )
  }

  const renderGrid = () => {
    const lines = []
    for (let i = 0; i <= canvasWidth / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * GRID_SIZE, 0, i * GRID_SIZE, canvasHeight]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      )
    }
    for (let j = 0; j <= canvasHeight / GRID_SIZE; j++) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j * GRID_SIZE, canvasWidth, j * GRID_SIZE]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      )
    }
    return lines
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="w-56 font-semibold"
                />
                <Badge variant="outline">{elements.length} elementow</Badge>
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Rozmiar pietra</Label>
                  <Input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Math.max(400, Number(e.target.value) || 400))}
                    className="h-9 w-24"
                  />
                  <span className="text-xs text-muted-foreground">x</span>
                  <Input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Math.max(300, Number(e.target.value) || 300))}
                    className="h-9 w-24"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGrid((v) => !v)}
                  className={showGrid ? "bg-muted" : ""}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-auto bg-white">
              <Stage
                ref={stageRef}
                width={canvasWidth}
                height={canvasHeight}
                scaleX={scale}
                scaleY={scale}
                onClick={handleStageClick}
                style={{ cursor: tool === "select" ? "default" : "crosshair" }}
              >
                <Layer>
                  <Rect 
                    x={0} 
                    y={0} 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    fill="#fafafa"
                    onClick={() => {
                      if (tool === "select") {
                        setSelectedId(null)
                      }
                    }}
                  />
                  {showGrid && renderGrid()}
                  {elements.map(renderElement)}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled
                    enabledAnchors={[
                      "top-left",
                      "top-center",
                      "top-right",
                      "middle-right",
                      "bottom-right",
                      "bottom-center",
                      "bottom-left",
                      "middle-left",
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) {
                        return oldBox
                      }
                      return newBox
                    }}
                  />
                </Layer>
              </Stage>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Narzedzia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("select")}
                className="justify-start gap-2"
              >
                <MousePointer className="h-4 w-4" />
                Zaznacz
              </Button>
              <Button
                variant={tool === "desk" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("desk")}
                className="justify-start gap-2"
              >
                <Monitor className="h-4 w-4" />
                Biurko
              </Button>
              <Button
                variant={tool === "room" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("room")}
                className="justify-start gap-2"
              >
                <Users className="h-4 w-4" />
                Sala
              </Button>
              <Button
                variant={tool === "wall" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("wall")}
                className="justify-start gap-2"
              >
                <Square className="h-4 w-4" />
                Sciana
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Kliknij na plansze aby dodac element. Zlap kotwice, aby zmienic rozmiar i obrot.
            </p>
          </CardContent>
        </Card>

        {selectedElement && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Wlasciwosci</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deleteSelected}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Nazwa</Label>
                <Input
                  value={selectedElement.name}
                  onChange={(e) => updateSelectedElement({ name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Pozycja X</Label>
                  <Input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => updateSelectedElement({ x: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Pozycja Y</Label>
                  <Input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => updateSelectedElement({ y: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Szerokosc</Label>
                  <Input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateSelectedElement({ width: Number(e.target.value) || GRID_SIZE })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Wysokosc</Label>
                  <Input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateSelectedElement({ height: Number(e.target.value) || GRID_SIZE })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Obrot</Label>
                  <Input
                    type="number"
                    value={selectedElement.rotation}
                    onChange={(e) => updateSelectedElement({ rotation: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Czcionka etykiety</Label>
                <Select
                  value={selectedElement.labelFontFamily || "Arial"}
                  onValueChange={(value) => updateSelectedElement({ labelFontFamily: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Tahoma">Tahoma</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Rozmiar tekstu</Label>
                  <Input
                    type="number"
                    value={selectedElement.labelFontSize ?? 12}
                    onChange={(e) => updateSelectedElement({ labelFontSize: Math.max(8, Number(e.target.value) || 12) })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Kolor tekstu</Label>
                  <Input
                    type="color"
                    value={selectedElement.labelColor || "#ffffff"}
                    onChange={(e) => updateSelectedElement({ labelColor: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Pozycja tekstu X</Label>
                  <Input
                    type="number"
                    value={selectedElement.labelOffsetX ?? 6}
                    onChange={(e) => updateSelectedElement({ labelOffsetX: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Pozycja tekstu Y</Label>
                  <Input
                    type="number"
                    value={selectedElement.labelOffsetY ?? 6}
                    onChange={(e) => updateSelectedElement({ labelOffsetY: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
              </div>
              {(selectedElement.type === "room" || selectedElement.type === "desk") && (
                <div className="space-y-2">
                  <Label className="text-xs">Strefa</Label>
                  <Input
                    value={selectedElement.zone || ""}
                    onChange={(e) => updateSelectedElement({ zone: e.target.value })}
                    placeholder="np. Strefa A"
                    className="h-9"
                  />
                </div>
              )}
              {(selectedElement.type === "room" || selectedElement.type === "desk") && (
                <div className="space-y-2">
                  <Label className="text-xs">Pojemnosc (osoby)</Label>
                  <Input
                    type="number"
                    value={selectedElement.capacity || 1}
                    onChange={(e) => updateSelectedElement({ capacity: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-9"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-4 space-y-2">
            <Button className="w-full gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Zapisz pietro
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={exportFloorPlan}>
              <Download className="h-4 w-4" />
              Eksportuj JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
