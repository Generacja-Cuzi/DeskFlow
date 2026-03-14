"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CalendarIcon,
  Search,
  Laptop,
  Monitor,
  Projector,
  Car,
  Headphones,
  Package,
  Check,
  X,
  Info,
} from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type EquipmentCategory = "laptops" | "monitors" | "projectors" | "vehicles" | "accessories"
type EquipmentStatus = "available" | "borrowed" | "maintenance"
type EquipmentWorkflowStatus = "pending" | "approved" | "issued" | "active" | "upcoming" | null

interface Equipment {
  id: string
  name: string
  category: EquipmentCategory
  status: EquipmentStatus
  serialNumber: string
  description: string
  borrowedBy?: string
  returnDate?: string
  workflowStatus?: EquipmentWorkflowStatus
  requestedBy?: string
}

const categoryInfo: Record<EquipmentCategory, { label: string; icon: React.ElementType }> = {
  laptops: { label: "Laptopy", icon: Laptop },
  monitors: { label: "Monitory", icon: Monitor },
  projectors: { label: "Projektory", icon: Projector },
  vehicles: { label: "Pojazdy", icon: Car },
  accessories: { label: "Akcesoria", icon: Headphones },
}

export default function SprzetPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const [borrowStartDate, setBorrowStartDate] = useState<Date>(new Date())
  const [borrowEndDate, setBorrowEndDate] = useState<Date>(new Date())
  const [purpose, setPurpose] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadEquipment = async () => {
    const response = await fetch('/api/equipment', { cache: 'no-store' })
    if (!response.ok) return

    const rows = await response.json()
    setEquipment(rows)
  }

  useEffect(() => {
    loadEquipment()
  }, [])

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleBorrow = (item: Equipment) => {
    setSelectedEquipment(item)
    setShowBorrowDialog(true)
  }

  const submitBorrowRequest = async () => {
    if (!selectedEquipment) return

    setSubmitting(true)

    const response = await fetch('/api/reservations/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: selectedEquipment.id,
        startDate: borrowStartDate.toISOString(),
        endDate: borrowEndDate.toISOString(),
        purpose,
      }),
    })

    if (response.ok) {
      setShowBorrowDialog(false)
      setPurpose("")
      await loadEquipment()
    }

    setSubmitting(false)
  }

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case "available":
        return <Badge className="bg-accent text-accent-foreground">Dostepny</Badge>
      case "borrowed":
        return <Badge variant="secondary">Wypozyczony</Badge>
      case "maintenance":
        return <Badge variant="destructive">W serwisie</Badge>
    }
  }

  const getWorkflowBadge = (status: EquipmentWorkflowStatus) => {
    if (!status) return null

    if (status === "pending") {
      return <Badge variant="outline">Wniosek oczekuje</Badge>
    }

    if (status === "approved") {
      return <Badge className="bg-primary text-primary-foreground">Zaakceptowany - czeka na wydanie</Badge>
    }

    if (status === "issued" || status === "active" || status === "upcoming") {
      return <Badge variant="secondary">Wydany</Badge>
    }

    return null
  }

  const getCategoryIcon = (category: EquipmentCategory) => {
    const Icon = categoryInfo[category].icon
    return <Icon className="h-5 w-5" />
  }

  const availableCount = equipment.filter(e => e.status === "available").length
  const borrowedCount = equipment.filter(e => e.status === "borrowed").length
  const pendingCount = equipment.filter(e => e.workflowStatus === "pending").length

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Wypozyczalnia sprzetu</h1>
          <p className="text-muted-foreground mt-1">
            Wypozycz laptopy, monitory, projektory i inne zasoby firmowe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span>{availableCount} dostepnych</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-muted-foreground" />
            <span>{borrowedCount} wypozyczonych</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span>{pendingCount} oczekujacych wnioskow</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj sprzetu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                <SelectItem value="laptops">Laptopy</SelectItem>
                <SelectItem value="monitors">Monitory</SelectItem>
                <SelectItem value="projectors">Projektory</SelectItem>
                <SelectItem value="vehicles">Pojazdy</SelectItem>
                <SelectItem value="accessories">Akcesoria</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="available">Dostepne</SelectItem>
                <SelectItem value="borrowed">Wypozyczone</SelectItem>
                <SelectItem value="maintenance">W serwisie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="all" onClick={() => setCategoryFilter("all")}>
            <Package className="h-4 w-4 mr-2" />
            Wszystko
          </TabsTrigger>
          {Object.entries(categoryInfo).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger key={key} value={key} onClick={() => setCategoryFilter(key)}>
              <Icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Equipment Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className={cn(
            "transition-all",
            item.status === "available" && "hover:shadow-md hover:border-accent/50"
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-lg",
                  item.status === "available" && "bg-accent/10",
                  item.status === "borrowed" && "bg-muted",
                  item.status === "maintenance" && "bg-destructive/10"
                )}>
                  {getCategoryIcon(item.category)}
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <CardTitle className="text-base">{item.name}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {categoryInfo[item.category].label} • {item.serialNumber}
                </CardDescription>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>

              {getWorkflowBadge(item.workflowStatus || null)}

              {item.workflowStatus && item.requestedBy && (
                <p className="text-xs text-muted-foreground">Wniosek: {item.requestedBy}</p>
              )}

              {item.status === "borrowed" && item.borrowedBy && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wypozyczyl:</span>
                    <span className="font-medium">{item.borrowedBy}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Zwrot do:</span>
                    <span>{item.returnDate}</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                {item.status === "available" && !item.workflowStatus ? (
                  <Button className="w-full" onClick={() => handleBorrow(item)}>
                    Zloz wniosek o wypozyczenie
                  </Button>
                ) : item.workflowStatus === "pending" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Wniosek oczekuje na akceptacje
                  </Button>
                ) : item.workflowStatus === "approved" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Zaakceptowano - czeka na wydanie
                  </Button>
                ) : item.status === "borrowed" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Niedostepny
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    W serwisie
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Brak wynikow</p>
            <p className="text-sm text-muted-foreground">
              Nie znaleziono sprzetu pasujacego do kryteriow wyszukiwania
            </p>
          </CardContent>
        </Card>
      )}

      {/* Borrow Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wypozycz sprzet</DialogTitle>
            <DialogDescription>
              Wypelnij formularz wypozyczenia
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
              <div className="flex items-center gap-3 mb-2">
                {selectedEquipment && getCategoryIcon(selectedEquipment.category)}
                <span className="font-medium">{selectedEquipment?.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedEquipment?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Data wypozyczenia</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(borrowStartDate, "d MMM", { locale: pl })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={borrowStartDate}
                        onSelect={(date) => date && setBorrowStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>Data zwrotu</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(borrowEndDate, "d MMM", { locale: pl })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={borrowEndDate}
                        onSelect={(date) => date && setBorrowEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel>Cel wypozyczenia</FieldLabel>
                <Textarea
                  placeholder="Opisz krotko, do czego potrzebujesz sprzetu..."
                  className="resize-none"
                  rows={3}
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Wniosek zostanie wyslany do akceptacji przez administratora.
                Otrzymasz powiadomienie o statusie wniosku.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBorrowDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Anuluj
            </Button>
            <Button onClick={submitBorrowRequest} disabled={submitting || !purpose.trim()}>
              <Check className="h-4 w-4 mr-2" />
              {submitting ? "Wysylanie..." : "Zloz wniosek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
