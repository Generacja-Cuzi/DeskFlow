"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Building2,
  Users,
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Company = {
  id: string
  name: string
  slug: string
  logo?: string
  users: number
  maxUsers: number
  plan: "starter" | "growth" | "enterprise"
  status: "active" | "trial" | "suspended"
  primaryColor: string
  secondaryColor: string
  createdAt: string
}

type PackageOption = {
  id: string
  name: string
  maxUsers: number
}

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false)
  const [targetCompanyForAdmin, setTargetCompanyForAdmin] = useState<Company | null>(null)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    department: "Management",
  })
  const [newCompany, setNewCompany] = useState({
    name: "",
    slug: "",
    plan: "starter" as Company["plan"],
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
  })

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const loadCompanies = async () => {
    const [companiesResponse, packagesResponse] = await Promise.all([
      fetch('/api/superadmin/companies', { cache: 'no-store' }),
      fetch('/api/superadmin/subscriptions', { cache: 'no-store' }),
    ])

    if (companiesResponse.ok) {
      const data = await companiesResponse.json()
      setCompanies(data)
    }

    if (packagesResponse.ok) {
      const payload = await packagesResponse.json()
      setPackageOptions(payload.packages || [])
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleCreateCompany = async () => {
    const response = await fetch('/api/superadmin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCompany),
    })
    if (!response.ok) return

    await loadCompanies()
    setIsCreateDialogOpen(false)
    setNewCompany({
      name: "",
      slug: "",
      plan: "starter",
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
    })
  }

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return

    const response = await fetch(`/api/superadmin/companies/${selectedCompany.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedCompany),
    })

    if (!response.ok) return

    await loadCompanies()
    setIsEditDialogOpen(false)
    setSelectedCompany(null)
  }

  const handleDeleteCompany = async (id: string) => {
    const response = await fetch(`/api/superadmin/companies/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) return
    await loadCompanies()
  }

  const openAddAdminDialog = (company: Company) => {
    setTargetCompanyForAdmin(company)
    setNewAdmin({
      name: "",
      email: "",
      department: "Management",
    })
    setIsAddAdminDialogOpen(true)
  }

  const handleCreateAdmin = async () => {
    if (!targetCompanyForAdmin) return

    const response = await fetch('/api/superadmin/company-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: targetCompanyForAdmin.id,
        ...newAdmin,
      }),
    })

    if (!response.ok) return

    await loadCompanies()
    setIsAddAdminDialogOpen(false)
    setTargetCompanyForAdmin(null)
  }

  const enterCompanyAsAdmin = async (company: Company) => {
    const brandingPayload = {
      id: company.id,
      name: company.name,
      logo: company.logo,
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
      description: `Panel firmy ${company.name}`,
    }

    const impersonationPayload = {
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      enteredAt: new Date().toISOString(),
    }

    const response = await fetch('/api/superadmin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id }),
    })

    if (!response.ok) return

    localStorage.setItem("companyBranding", JSON.stringify(brandingPayload))
    localStorage.setItem("superadminImpersonation", JSON.stringify(impersonationPayload))
    router.push("/admin")
  }

  const getPlanBadge = (plan: Company["plan"]) => {
    switch (plan) {
      case "starter":
        return <Badge variant="secondary">Starter</Badge>
      case "growth":
        return <Badge className="bg-blue-500">Growth</Badge>
      case "enterprise":
        return <Badge className="bg-purple-500">Enterprise</Badge>
    }
  }

  const getStatusBadge = (status: Company["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Aktywna</Badge>
      case "trial":
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Trial</Badge>
      case "suspended":
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Zawieszona</Badge>
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            Zarzadzanie firmami
          </h1>
          <p className="text-muted-foreground mt-1">
            Tworzenie i konfiguracja witryn dla klientow DeskFlow
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nowa firma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Utworz nowa firme</DialogTitle>
              <DialogDescription>
                Wypelnij dane firmy. Kazda firma otrzyma wlasna witryne z mozliwoscia personalizacji.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nazwa firmy</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="np. Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label>Adres witryny (slug)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">deskflow.io/</span>
                  <Input
                    value={newCompany.slug}
                    onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="acme"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={newCompany.plan}
                  onValueChange={(value: Company["plan"]) => setNewCompany({ ...newCompany, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreateCompany}>
                Utworz firme
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj firm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Zawieszone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Uzytkownicy</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kolory</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {company.logo ? (
                          <AvatarImage src={company.logo} />
                        ) : (
                          <AvatarFallback style={{ backgroundColor: company.primaryColor }} className="text-white text-xs">
                            {company.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-xs text-muted-foreground">od {company.createdAt}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">/{company.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {company.users}/{company.maxUsers || 0}
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(company.plan)}</TableCell>
                  <TableCell>{getStatusBadge(company.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div
                        className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: company.primaryColor }}
                      />
                      <div
                        className="h-5 w-5 rounded-full border-2 border-white shadow-sm -ml-2"
                        style={{ backgroundColor: company.secondaryColor }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCompany(company)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => enterCompanyAsAdmin(company)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Wejdz jako admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAddAdminDialog(company)}>
                          <Users className="h-4 w-4 mr-2" />
                          Dodaj admina firmy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCompany(company.id)}
                        >
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

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj firme: {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Zmien ustawienia firmy i personalizacje witryny
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <Tabs defaultValue="general" className="pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Ogolne</TabsTrigger>
                <TabsTrigger value="settings">Ustawienia</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nazwa firmy</Label>
                  <Input
                    value={selectedCompany.name}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={selectedCompany.slug}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, slug: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select
                      value={selectedCompany.plan}
                      onValueChange={(value: Company["plan"]) =>
                        setSelectedCompany({ ...selectedCompany, plan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {packageOptions.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedCompany.status}
                      onValueChange={(value: Company["status"]) =>
                        setSelectedCompany({ ...selectedCompany, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktywna</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Zawieszona</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Dostep do API</p>
                      <p className="text-sm text-muted-foreground">Generuj klucze API dla integracji</p>
                    </div>
                    <Button variant="outline">Zarzadzaj</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Wlasna domena</p>
                      <p className="text-sm text-muted-foreground">Skonfiguruj wlasna domene dla witryny</p>
                    </div>
                    <Button variant="outline">Konfiguruj</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium text-destructive">Strefa zagrozen</p>
                      <p className="text-sm text-muted-foreground">Usun firme i wszystkie dane</p>
                    </div>
                    <Button variant="destructive">Usun firme</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdateCompany}>Zapisz zmiany</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj admina firmy</DialogTitle>
            <DialogDescription>
              {targetCompanyForAdmin
                ? `Nowy administrator zostanie przypisany do firmy ${targetCompanyForAdmin.name}.`
                : "Uzupelnij dane nowego administratora."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Imie i nazwisko</Label>
              <Input
                value={newAdmin.name}
                onChange={(event) => setNewAdmin({ ...newAdmin, name: event.target.value })}
                placeholder="np. Anna Nowak"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })}
                placeholder="anna.nowak@firma.pl"
              />
            </div>
            <div className="space-y-2">
              <Label>Dzial</Label>
              <Input
                value={newAdmin.department}
                onChange={(event) => setNewAdmin({ ...newAdmin, department: event.target.value })}
                placeholder="Management"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAddAdminDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleCreateAdmin}>Dodaj admina</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
