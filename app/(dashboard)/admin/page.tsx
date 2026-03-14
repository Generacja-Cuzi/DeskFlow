"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  Monitor,
  Package,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const initialStats: Array<{ name: string; value: string; change: string; icon?: any; color?: string }> = []

const fallbackStats = [
  { name: "Aktywne rezerwacje", value: "156", change: "+12%", icon: Calendar, color: "text-primary" },
  { name: "Uzytkownicy", value: "89", change: "+5%", icon: Users, color: "text-accent" },
  { name: "Dostepne biurka", value: "24/40", change: "60%", icon: Monitor, color: "text-chart-3" },
  { name: "Wypozyczony sprzet", value: "18", change: "-3%", icon: Package, color: "text-chart-5" },
]

const initialUsageData: Array<{ name: string; biurka: number; sale: number; sprzet: number }> = []

const fallbackUsageData = [
  { name: "Pon", biurka: 35, sale: 8, sprzet: 12 },
  { name: "Wt", biurka: 38, sale: 10, sprzet: 15 },
  { name: "Sr", biurka: 40, sale: 12, sprzet: 14 },
  { name: "Czw", biurka: 36, sale: 9, sprzet: 16 },
  { name: "Pt", biurka: 28, sale: 6, sprzet: 10 },
]

const initialMonthlyData: Array<{ name: string; rezerwacje: number }> = []

const fallbackMonthlyData = [
  { name: "Sty", rezerwacje: 120 },
  { name: "Lut", rezerwacje: 145 },
  { name: "Mar", rezerwacje: 160 },
  { name: "Kwi", rezerwacje: 155 },
  { name: "Maj", rezerwacje: 180 },
  { name: "Cze", rezerwacje: 175 },
]

const initialPendingRequests: Array<{
  id: string
  user: string
  type: string
  item: string
  date: string
  status: string
  purpose?: string | null
}> = []

const fallbackPendingRequests = [
  { id: 1, user: "Anna Nowak", type: "Sprzet", item: "MacBook Pro 16\"", date: "11.03.2026", status: "pending" },
  { id: 2, user: "Piotr Wisniewski", type: "Sprzet", item: "Projektor Epson", date: "11.03.2026", status: "pending" },
  { id: 3, user: "Maria Kowalczyk", type: "Pojazd", item: "Ford Focus", date: "10.03.2026", status: "pending" },
]

const initialUsers: Array<{ id: string; name: string; email: string; department: string | null; role: string; status: string }> = []

const fallbackUsers = [
  { id: 1, name: "Jan Kowalski", email: "jan.kowalski@firma.pl", department: "IT", role: "admin", status: "active" },
  { id: 2, name: "Anna Nowak", email: "anna.nowak@firma.pl", department: "Marketing", role: "user", status: "active" },
  { id: 3, name: "Piotr Wisniewski", email: "piotr.wisniewski@firma.pl", department: "Sales", role: "user", status: "active" },
  { id: 4, name: "Maria Kowalczyk", email: "maria.kowalczyk@firma.pl", department: "HR", role: "user", status: "inactive" },
  { id: 5, name: "Tomasz Lewandowski", email: "tomasz.lewandowski@firma.pl", department: "Finance", role: "user", status: "active" },
]

const initialResources: Array<{
  id: string
  name: string
  type: string
  location: string
  status: string
  workflowStatus?: string | null
  workflowReservationId?: string | null
  workflowUser?: string | null
  workflowDueDate?: string | null
}> = []

type AdminReservation = {
  id: string
  type: "desk" | "room"
  name: string
  location: string
  date: string
  status: string
  startAt: string
  endAt: string
  userName: string
  userEmail: string
  meetingTitle?: string | null
}

type AdminUser = {
  id: string
  name: string
  email: string
  department: string | null
  role: string
  status: string
}

type AdminResource = {
  id: string
  name: string
  type: string
  category?: string | null
  location: string
  serialNumber?: string | null
  description?: string | null
  status: string
  workflowStatus?: string | null
  workflowReservationId?: string | null
  workflowUser?: string | null
  workflowDueDate?: string | null
}

const equipmentCategories = [
  { value: "all", label: "Wszystkie" },
  { value: "laptops", label: "Laptopy" },
  { value: "monitors", label: "Monitory" },
  { value: "projectors", label: "Projektory" },
  { value: "vehicles", label: "Pojazdy" },
  { value: "accessories", label: "Akcesoria" },
]

const fallbackResources = [
  { id: 1, name: "Biurko A-01", type: "Biurko", location: "Strefa A, P1", status: "available" },
  { id: 2, name: "Sala Konferencyjna A", type: "Sala", location: "Pietro 1", status: "occupied" },
  { id: 3, name: "MacBook Pro 16\"", type: "Laptop", location: "Magazyn IT", status: "borrowed" },
  { id: 4, name: "Projektor Epson", type: "Projektor", location: "Magazyn IT", status: "available" },
  { id: 5, name: "Ford Focus", type: "Pojazd", location: "Parking", status: "borrowed" },
]

const statIconByName: Record<string, any> = {
  "Aktywne rezerwacje": Calendar,
  Uzytkownicy: Users,
  "Dostepne biurka": Monitor,
  "Wypozyczony sprzet": Package,
}

export default function AdminPage() {
  const [statsData, setStatsData] = useState(initialStats)
  const [usageDataState, setUsageDataState] = useState(initialUsageData)
  const [monthlyDataState, setMonthlyDataState] = useState(initialMonthlyData)
  const [pendingRequestsState, setPendingRequestsState] = useState(initialPendingRequests)
  const [usersState, setUsersState] = useState<AdminUser[]>(initialUsers as unknown as AdminUser[])
  const [resourcesState, setResourcesState] = useState<AdminResource[]>(initialResources)
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false)
  const [showEditResourceDialog, setShowEditResourceDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("all")
  const [resourceStatusFilter, setResourceStatusFilter] = useState("all")
  const [reservationSearchQuery, setReservationSearchQuery] = useState("")
  const [filterFromDate, setFilterFromDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterToDate, setFilterToDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterFromTime, setFilterFromTime] = useState("00:00")
  const [filterToTime, setFilterToTime] = useState("23:59")
  const [deskReservationsState, setDeskReservationsState] = useState<AdminReservation[]>([])
  const [roomReservationsState, setRoomReservationsState] = useState<AdminReservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
  })
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null)
  const [resourceForm, setResourceForm] = useState({
    name: "",
    category: "laptops",
    location: "",
    serialNumber: "",
    description: "",
    status: "available",
  })

  const loadAdminReservations = async () => {
    setLoadingReservations(true)

    const query = new URLSearchParams({
      fromDate: filterFromDate,
      toDate: filterToDate,
      fromTime: filterFromTime,
      toTime: filterToTime,
    })

    const [deskResponse, roomResponse] = await Promise.all([
      fetch(`/api/admin/reservations?type=desk&${query.toString()}`, { cache: "no-store" }),
      fetch(`/api/admin/reservations?type=room&${query.toString()}`, { cache: "no-store" }),
    ])

    if (deskResponse.ok) {
      setDeskReservationsState(await deskResponse.json())
    }

    if (roomResponse.ok) {
      setRoomReservationsState(await roomResponse.json())
    }

    setLoadingReservations(false)
  }

  const loadOverview = async () => {
    const response = await fetch('/api/admin/overview', { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json()
    setStatsData(data.stats || fallbackStats)
    setUsageDataState(data.usageData || fallbackUsageData)
    setMonthlyDataState(data.monthlyData || fallbackMonthlyData)
    setPendingRequestsState(data.pendingRequests || fallbackPendingRequests)
    setUsersState(data.users || fallbackUsers)
    setResourcesState(data.resources || fallbackResources)
  }

  useEffect(() => {
    loadOverview()
  }, [])

  useEffect(() => {
    loadAdminReservations()
  }, [filterFromDate, filterToDate, filterFromTime, filterToTime])

  const handleAddUser = async () => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })

    if (!response.ok) return

    setShowAddUserDialog(false)
    setNewUser({
      name: "",
      email: "",
      department: "",
    })
    await loadOverview()
  }

  const handlePromoteToAdmin = async (userId: string) => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleDemoteToUser = async (userId: string) => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleDeleteUser = async (userId: string) => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setShowEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingUser.name,
        email: editingUser.email,
        department: editingUser.department || "",
        status: editingUser.status,
      }),
    })

    if (!response.ok) return

    setShowEditUserDialog(false)
    setEditingUser(null)
    await loadOverview()
  }

  const handleApprove = async (id: string | number) => {
    const response = await fetch(`/api/admin/requests/${id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleReject = async (id: string | number) => {
    const response = await fetch(`/api/admin/requests/${id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'reject' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleIssueResource = async (resourceId: string) => {
    const response = await fetch(`/api/admin/resources/${resourceId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'issue' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleReturnResource = async (resourceId: string) => {
    const response = await fetch(`/api/admin/resources/${resourceId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'return' }),
    })

    if (!response.ok) return
    await loadOverview()
  }

  const handleCancelReservation = async (reservationId: string) => {
    const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PATCH",
    })

    if (!response.ok) return

    await Promise.all([loadOverview(), loadAdminReservations()])
  }

  const handleDeleteReservationFromHistory = async (reservationId: string) => {
    const response = await fetch(`/api/admin/reservations/${reservationId}`, {
      method: "DELETE",
    })

    if (!response.ok) return

    await Promise.all([loadOverview(), loadAdminReservations()])
  }

  const resetResourceForm = () => {
    setResourceForm({
      name: "",
      category: "laptops",
      location: "",
      serialNumber: "",
      description: "",
      status: "available",
    })
  }

  const handleCreateResource = async () => {
    const response = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resourceForm),
    })

    if (!response.ok) return

    setShowAddResourceDialog(false)
    resetResourceForm()
    await loadOverview()
  }

  const handleOpenEditResource = (resource: AdminResource) => {
    setEditingResource(resource)
    setResourceForm({
      name: resource.name,
      category: resource.category || "laptops",
      location: resource.location,
      serialNumber: resource.serialNumber || "",
      description: resource.description || "",
      status: resource.status,
    })
    setShowEditResourceDialog(true)
  }

  const handleUpdateResource = async () => {
    if (!editingResource) return

    const response = await fetch(`/api/admin/resources/${editingResource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resourceForm),
    })

    if (!response.ok) return

    setShowEditResourceDialog(false)
    setEditingResource(null)
    resetResourceForm()
    await loadOverview()
  }

  const handleDeleteResource = async (resourceId: string) => {
    const response = await fetch(`/api/admin/resources/${resourceId}`, {
      method: "DELETE",
    })

    if (!response.ok) return

    await loadOverview()
  }

  const handleExportReport = () => {
    window.open("/api/admin/reports/export", "_blank")
  }

  const filteredResources = resourcesState.filter((resource) => {
    if (!searchQuery.trim()) {
      if (resourceCategoryFilter !== "all" && resource.category !== resourceCategoryFilter) {
        return false
      }

      if (resourceStatusFilter !== "all" && resource.status !== resourceStatusFilter) {
        return false
      }

      return true
    }

    const query = searchQuery.toLowerCase()
    const matchesQuery = (
      resource.name.toLowerCase().includes(query) ||
      resource.type.toLowerCase().includes(query) ||
      resource.location.toLowerCase().includes(query)
    )

    const matchesCategory = resourceCategoryFilter === "all" || resource.category === resourceCategoryFilter
    const matchesStatus = resourceStatusFilter === "all" || resource.status === resourceStatusFilter

    return matchesQuery && matchesCategory && matchesStatus
  })

  const filterReservationRows = (rows: AdminReservation[]) => {
    if (!reservationSearchQuery.trim()) {
      return rows
    }

    const query = reservationSearchQuery.toLowerCase()
    return rows.filter((reservation) => {
      return (
        reservation.name.toLowerCase().includes(query) ||
        reservation.location.toLowerCase().includes(query) ||
        reservation.userName.toLowerCase().includes(query) ||
        reservation.userEmail.toLowerCase().includes(query)
      )
    })
  }

  const formatDateLabel = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.valueOf())) {
      return value
    }

    return parsed.toLocaleDateString("pl-PL")
  }

  const formatTimeLabel = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.valueOf())) {
      return "--:--"
    }

    return parsed.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Panel administracyjny</h1>
          <p className="text-muted-foreground mt-1">
            Zarzadzaj zasobami, uzytkownikami i rezerwacjami
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Eksportuj raport
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsData.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {(() => {
                  const Icon = (stat as any).icon || statIconByName[stat.name] || Calendar
                  return <Icon className={`h-8 w-8 ${stat.color}`} />
                })()}
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Wykorzystanie zasobow (tydzien)</CardTitle>
            <CardDescription>Dzienna liczba rezerwacji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageDataState}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="biurka" name="Biurka" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sale" name="Sale" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sprzet" name="Sprzet" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend rezerwacji</CardTitle>
            <CardDescription>Miesieczna liczba rezerwacji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyDataState}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rezerwacje"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-chart-3" />
                Oczekujace wnioski
              </CardTitle>
              <CardDescription>Wnioski wymagajace akceptacji</CardDescription>
            </div>
            <Badge variant="secondary">{pendingRequestsState.length} oczekujace</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uzytkownik</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Zasob</TableHead>
                <TableHead>Cel</TableHead>
                <TableHead>Data wniosku</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequestsState.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.type}</Badge>
                  </TableCell>
                  <TableCell>{request.item}</TableCell>
                  <TableCell>{request.purpose || "-"}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === "pending" ? "secondary" : "outline"}>
                      {request.status === "pending" ? "Oczekuje" : request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-accent hover:bg-accent/10"
                        onClick={() => handleApprove(request.id)}
                        disabled={request.status !== "pending"}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(request.id)}
                        disabled={request.status !== "pending"}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabs for Users and Resources */}
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="desks">
            <Monitor className="h-4 w-4 mr-2" />
            Biurka
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <Calendar className="h-4 w-4 mr-2" />
            Sale
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileText className="h-4 w-4 mr-2" />
            Sprzet
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Uzytkownicy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="desks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle>Rezerwacje biurek</CardTitle>
                  <CardDescription>Wyszukaj rezerwacje po przedziale dat i godzin oraz anuluj je.</CardDescription>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <Input type="date" value={filterFromDate} onChange={(event) => setFilterFromDate(event.target.value)} />
                  <Input type="date" value={filterToDate} onChange={(event) => setFilterToDate(event.target.value)} />
                  <Input type="time" value={filterFromTime} onChange={(event) => setFilterFromTime(event.target.value)} />
                  <Input type="time" value={filterToTime} onChange={(event) => setFilterToTime(event.target.value)} />
                  <Input
                    placeholder="Szukaj uzytkownika lub biurka"
                    value={reservationSearchQuery}
                    onChange={(event) => setReservationSearchQuery(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Biurko</TableHead>
                    <TableHead>Uzytkownik</TableHead>
                    <TableHead>Lokalizacja</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Godziny</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loadingReservations && filterReservationRows(deskReservationsState).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Brak rezerwacji biurek dla wybranego przedzialu.
                      </TableCell>
                    </TableRow>
                  )}
                  {filterReservationRows(deskReservationsState).map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.name}</TableCell>
                      <TableCell>
                        <div>
                          <p>{reservation.userName}</p>
                          <p className="text-xs text-muted-foreground">{reservation.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reservation.location}</TableCell>
                      <TableCell>{formatDateLabel(reservation.date)}</TableCell>
                      <TableCell>{formatTimeLabel(reservation.startAt)} - {formatTimeLabel(reservation.endAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reservation.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={["cancelled", "completed", "rejected"].includes(reservation.status)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Anuluj
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteReservationFromHistory(reservation.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Usun z historii
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle>Rezerwacje sal</CardTitle>
                  <CardDescription>Wyszukaj rezerwacje po przedziale dat i godzin oraz anuluj je.</CardDescription>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <Input type="date" value={filterFromDate} onChange={(event) => setFilterFromDate(event.target.value)} />
                  <Input type="date" value={filterToDate} onChange={(event) => setFilterToDate(event.target.value)} />
                  <Input type="time" value={filterFromTime} onChange={(event) => setFilterFromTime(event.target.value)} />
                  <Input type="time" value={filterToTime} onChange={(event) => setFilterToTime(event.target.value)} />
                  <Input
                    placeholder="Szukaj uzytkownika lub sali"
                    value={reservationSearchQuery}
                    onChange={(event) => setReservationSearchQuery(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sala</TableHead>
                    <TableHead>Uzytkownik</TableHead>
                    <TableHead>Lokalizacja</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Godziny</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loadingReservations && filterReservationRows(roomReservationsState).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Brak rezerwacji sal dla wybranego przedzialu.
                      </TableCell>
                    </TableRow>
                  )}
                  {filterReservationRows(roomReservationsState).map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{reservation.name}</p>
                          {reservation.meetingTitle && (
                            <p className="text-xs text-muted-foreground">{reservation.meetingTitle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{reservation.userName}</p>
                          <p className="text-xs text-muted-foreground">{reservation.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reservation.location}</TableCell>
                      <TableCell>{formatDateLabel(reservation.date)}</TableCell>
                      <TableCell>{formatTimeLabel(reservation.startAt)} - {formatTimeLabel(reservation.endAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reservation.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={["cancelled", "completed", "rejected"].includes(reservation.status)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Anuluj
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteReservationFromHistory(reservation.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Usun z historii
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle>Zarzadzanie sprzetem</CardTitle>
                  <CardDescription>
                    Sprzet firmowy z filtrami kategorii i statusu.
                  </CardDescription>
                </div>
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative w-full lg:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Szukaj zasobu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={resourceCategoryFilter} onValueChange={setResourceCategoryFilter}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Kategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={resourceStatusFilter} onValueChange={setResourceStatusFilter}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie statusy</SelectItem>
                      <SelectItem value="available">Dostepne</SelectItem>
                      <SelectItem value="borrowed">Wypozyczone</SelectItem>
                      <SelectItem value="maintenance">W serwisie</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowAddResourceDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj zasob
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Lokalizacja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.type}</Badge>
                      </TableCell>
                      <TableCell>{resource.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant={resource.status === "available" ? "default" : "secondary"}
                          className={resource.status === "available" ? "bg-accent text-accent-foreground" : ""}
                        >
                          {resource.status === "available" ? "Dostepny" :
                           resource.status === "occupied" ? "Zajety" : "Wypozyczony"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {resource.workflowStatus ? (
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {resource.workflowStatus === "pending" && "Wniosek oczekuje"}
                              {resource.workflowStatus === "approved" && "Gotowe do wydania"}
                              {resource.workflowStatus === "issued" && "Wydane"}
                              {!['pending', 'approved', 'issued'].includes(resource.workflowStatus) && resource.workflowStatus}
                            </Badge>
                            {resource.workflowUser && (
                              <p className="text-xs text-muted-foreground">{resource.workflowUser}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Brak aktywnego obiegu</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {resource.workflowStatus === "approved" && (
                            <Button size="sm" onClick={() => handleIssueResource(String(resource.id))}>
                              Wydaj
                            </Button>
                          )}
                          {resource.workflowStatus === "issued" && (
                            <Button size="sm" variant="outline" onClick={() => handleReturnResource(String(resource.id))}>
                              Zwrot
                            </Button>
                          )}
                          {resource.workflowStatus !== "approved" && resource.workflowStatus !== "issued" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditResource(resource)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edytuj
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteResource(String(resource.id))}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Usun
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Zarzadzanie uzytkownikami</CardTitle>
                  <CardDescription>Lista uzytkownikow systemu</CardDescription>
                </div>
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj uzytkownika
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imie i nazwisko</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dzial</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersState.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrator" : "Uzytkownik"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.status === "active" ? "text-accent border-accent" : ""}
                        >
                          {user.status === "active" ? "Aktywny" : "Nieaktywny"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role !== "admin" && (
                              <DropdownMenuItem onClick={() => handlePromoteToAdmin(String(user.id))}>
                                <Users className="h-4 w-4 mr-2" />
                                Nadaj role administratora
                              </DropdownMenuItem>
                            )}
                            {user.role === "admin" && (
                              <DropdownMenuItem onClick={() => handleDemoteToUser(String(user.id))}>
                                <Users className="h-4 w-4 mr-2" />
                                Odbierz role administratora
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleOpenEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(String(user.id))}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Usun
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <Dialog open={showAddResourceDialog} onOpenChange={setShowAddResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowy zasob</DialogTitle>
            <DialogDescription>
              Dodawanie biurek i sal odbywa sie w edytorze pietra. Tutaj dodajesz zasoby sprzetowe.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nazwa zasobu</FieldLabel>
                <Input
                  placeholder="np. MacBook Pro 14"
                  value={resourceForm.name}
                  onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Typ zasobu</FieldLabel>
                <Select value={resourceForm.category} onValueChange={(value) => setResourceForm({ ...resourceForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptops">Laptop</SelectItem>
                    <SelectItem value="monitors">Monitor</SelectItem>
                    <SelectItem value="projectors">Projektor</SelectItem>
                    <SelectItem value="vehicles">Pojazd</SelectItem>
                    <SelectItem value="accessories">Akcesorium</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Lokalizacja</FieldLabel>
                <Input
                  placeholder="np. Magazyn IT"
                  value={resourceForm.location}
                  onChange={(event) => setResourceForm({ ...resourceForm, location: event.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Numer seryjny / Identyfikator</FieldLabel>
                <Input
                  placeholder="np. SN-2024-001"
                  value={resourceForm.serialNumber}
                  onChange={(event) => setResourceForm({ ...resourceForm, serialNumber: event.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Opis</FieldLabel>
                <Input
                  placeholder="Krotki opis zasobu"
                  value={resourceForm.description}
                  onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddResourceDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCreateResource}>
              Dodaj zasob
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditResourceDialog} onOpenChange={setShowEditResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj zasob</DialogTitle>
            <DialogDescription>
              Zmien dane zasobu sprzetowego.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nazwa zasobu</FieldLabel>
                <Input
                  value={resourceForm.name}
                  onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })}
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Kategoria</FieldLabel>
                <Select value={resourceForm.category} onValueChange={(value) => setResourceForm({ ...resourceForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptops">Laptop</SelectItem>
                    <SelectItem value="monitors">Monitor</SelectItem>
                    <SelectItem value="projectors">Projektor</SelectItem>
                    <SelectItem value="vehicles">Pojazd</SelectItem>
                    <SelectItem value="accessories">Akcesorium</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={resourceForm.status} onValueChange={(value) => setResourceForm({ ...resourceForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Dostepny</SelectItem>
                    <SelectItem value="borrowed">Wypozyczony</SelectItem>
                    <SelectItem value="maintenance">W serwisie</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Lokalizacja</FieldLabel>
                <Input
                  value={resourceForm.location}
                  onChange={(event) => setResourceForm({ ...resourceForm, location: event.target.value })}
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Numer seryjny</FieldLabel>
                <Input
                  value={resourceForm.serialNumber}
                  onChange={(event) => setResourceForm({ ...resourceForm, serialNumber: event.target.value })}
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Opis</FieldLabel>
                <Input
                  value={resourceForm.description}
                  onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditResourceDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdateResource}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj uzytkownika</DialogTitle>
            <DialogDescription>
              Uzytkownik pojawi sie w tej firmie po pierwszym logowaniu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Imie i nazwisko</FieldLabel>
                <Input
                  placeholder="np. Jan Kowalski"
                  value={newUser.name}
                  onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="jan.kowalski@firma.pl"
                  value={newUser.email}
                  onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Dzial</FieldLabel>
                <Input
                  placeholder="np. IT"
                  value={newUser.department}
                  onChange={(event) => setNewUser({ ...newUser, department: event.target.value })}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddUser}>Dodaj uzytkownika</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj uzytkownika</DialogTitle>
            <DialogDescription>
              Zmien dane i status uzytkownika.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Imie i nazwisko</FieldLabel>
                <Input
                  value={editingUser?.name || ""}
                  onChange={(event) =>
                    setEditingUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={editingUser?.email || ""}
                  onChange={(event) =>
                    setEditingUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            email: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Dzial</FieldLabel>
                <Input
                  value={editingUser?.department || ""}
                  onChange={(event) =>
                    setEditingUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            department: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={editingUser?.status || "active"}
                  onValueChange={(value) =>
                    setEditingUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: value,
                          }
                        : prev
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktywny</SelectItem>
                    <SelectItem value="inactive">Nieaktywny</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdateUser}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
