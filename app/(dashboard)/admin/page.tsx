"use client"

import { useState } from "react"
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

const stats = [
  { name: "Aktywne rezerwacje", value: "156", change: "+12%", icon: Calendar, color: "text-primary" },
  { name: "Uzytkownicy", value: "89", change: "+5%", icon: Users, color: "text-accent" },
  { name: "Dostepne biurka", value: "24/40", change: "60%", icon: Monitor, color: "text-chart-3" },
  { name: "Wypozyczony sprzet", value: "18", change: "-3%", icon: Package, color: "text-chart-5" },
]

const usageData = [
  { name: "Pon", biurka: 35, sale: 8, sprzet: 12 },
  { name: "Wt", biurka: 38, sale: 10, sprzet: 15 },
  { name: "Sr", biurka: 40, sale: 12, sprzet: 14 },
  { name: "Czw", biurka: 36, sale: 9, sprzet: 16 },
  { name: "Pt", biurka: 28, sale: 6, sprzet: 10 },
]

const monthlyData = [
  { name: "Sty", rezerwacje: 120 },
  { name: "Lut", rezerwacje: 145 },
  { name: "Mar", rezerwacje: 160 },
  { name: "Kwi", rezerwacje: 155 },
  { name: "Maj", rezerwacje: 180 },
  { name: "Cze", rezerwacje: 175 },
]

const pendingRequests = [
  { id: 1, user: "Anna Nowak", type: "Sprzet", item: "MacBook Pro 16\"", date: "11.03.2026", status: "pending" },
  { id: 2, user: "Piotr Wisniewski", type: "Sprzet", item: "Projektor Epson", date: "11.03.2026", status: "pending" },
  { id: 3, user: "Maria Kowalczyk", type: "Pojazd", item: "Ford Focus", date: "10.03.2026", status: "pending" },
]

const users = [
  { id: 1, name: "Jan Kowalski", email: "jan.kowalski@firma.pl", department: "IT", role: "admin", status: "active" },
  { id: 2, name: "Anna Nowak", email: "anna.nowak@firma.pl", department: "Marketing", role: "user", status: "active" },
  { id: 3, name: "Piotr Wisniewski", email: "piotr.wisniewski@firma.pl", department: "Sales", role: "user", status: "active" },
  { id: 4, name: "Maria Kowalczyk", email: "maria.kowalczyk@firma.pl", department: "HR", role: "user", status: "inactive" },
  { id: 5, name: "Tomasz Lewandowski", email: "tomasz.lewandowski@firma.pl", department: "Finance", role: "user", status: "active" },
]

const resources = [
  { id: 1, name: "Biurko A-01", type: "Biurko", location: "Strefa A, P1", status: "available" },
  { id: 2, name: "Sala Konferencyjna A", type: "Sala", location: "Pietro 1", status: "occupied" },
  { id: 3, name: "MacBook Pro 16\"", type: "Laptop", location: "Magazyn IT", status: "borrowed" },
  { id: 4, name: "Projektor Epson", type: "Projektor", location: "Magazyn IT", status: "available" },
  { id: 5, name: "Ford Focus", type: "Pojazd", location: "Parking", status: "borrowed" },
]

export default function AdminPage() {
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleApprove = (id: number) => {
    console.log("[v0] Approved request:", id)
  }

  const handleReject = (id: number) => {
    console.log("[v0] Rejected request:", id)
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksportuj raport
          </Button>
          <Button onClick={() => setShowAddResourceDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj zasob
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
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
                <BarChart data={usageData}>
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
                <AreaChart data={monthlyData}>
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
            <Badge variant="secondary">{pendingRequests.length} oczekujace</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uzytkownik</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Zasob</TableHead>
                <TableHead>Data wniosku</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.type}</Badge>
                  </TableCell>
                  <TableCell>{request.item}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-accent hover:bg-accent/10"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(request.id)}
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
          <TabsTrigger value="resources">
            <Package className="h-4 w-4 mr-2" />
            Zasoby
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Uzytkownicy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Zarzadzanie zasobami</CardTitle>
                  <CardDescription>Lista wszystkich zasobow w systemie</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj zasobu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
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
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Zarzadzanie uzytkownikami</CardTitle>
                  <CardDescription>Lista uzytkownikow systemu</CardDescription>
                </div>
                <Button>
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
                  {users.map((user) => (
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
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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
              Wprowadz dane nowego zasobu
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nazwa zasobu</FieldLabel>
                <Input placeholder="np. Biurko A-15" />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Typ zasobu</FieldLabel>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desk">Biurko</SelectItem>
                    <SelectItem value="room">Sala konferencyjna</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="projector">Projektor</SelectItem>
                    <SelectItem value="vehicle">Pojazd</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Lokalizacja</FieldLabel>
                <Input placeholder="np. Strefa A, Pietro 1" />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Numer seryjny / Identyfikator</FieldLabel>
                <Input placeholder="np. SN-2024-001" />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddResourceDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={() => setShowAddResourceDialog(false)}>
              Dodaj zasob
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
