"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

type Company = {
  id: string
  name: string
}

type UserRow = {
  id: string
  name: string
  email: string
  department: string | null
  role: "superadmin" | "admin" | "user"
  status: "active" | "inactive"
  companyId: string | null
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default function SuperadminUsersPage() {
  const [activeTab, setActiveTab] = useState<"company" | "application">("company")
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [companyUsers, setCompanyUsers] = useState<UserRow[]>([])
  const [applicationUsers, setApplicationUsers] = useState<UserRow[]>([])
  const [isAddCompanyUserOpen, setIsAddCompanyUserOpen] = useState(false)
  const [isAddSuperadminOpen, setIsAddSuperadminOpen] = useState(false)
  const [newCompanyUser, setNewCompanyUser] = useState({
    name: "",
    email: "",
    department: "",
  })
  const [newCompanyUserErrors, setNewCompanyUserErrors] = useState<{ name?: string; email?: string; companyId?: string }>({})
  const [newSuperadmin, setNewSuperadmin] = useState({
    name: "",
    email: "",
    department: "Management",
  })
  const [newSuperadminErrors, setNewSuperadminErrors] = useState<{ name?: string; email?: string }>({})

  const loadData = async (scope: "company" | "application", companyId?: string) => {
    const params = new URLSearchParams()
    params.set("scope", scope)
    if (companyId) {
      params.set("companyId", companyId)
    }

    const query = params.toString() ? `?${params.toString()}` : ""
    const response = await fetch(`/api/superadmin/users${query}`, { cache: "no-store" })
    if (!response.ok) return

    const data = await response.json()
    setCompanies(data.companies || [])

    if (scope === "company") {
      setSelectedCompanyId(data.selectedCompanyId || "")
      setCompanyUsers(data.users || [])
      return
    }

    setApplicationUsers(data.users || [])
  }

  useEffect(() => {
    loadData("company")
  }, [])

  const handleCompanyChange = async (companyId: string) => {
    await loadData("company", companyId)
  }

  const handleUserUpdate = async (
    userId: string,
    body: Partial<Pick<UserRow, "role" | "status" | "companyId">>
  ) => {
    const response = await fetch(`/api/superadmin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        scope: activeTab,
        companyId: activeTab === "company" ? selectedCompanyId : body.companyId,
      }),
    })

    if (!response.ok) return

    if (activeTab === "company") {
      await loadData("company", selectedCompanyId)
      return
    }

    await loadData("application")
  }

  const handleDeleteUser = async (userId: string) => {
    const query =
      activeTab === "company"
        ? `?scope=company&companyId=${encodeURIComponent(selectedCompanyId)}`
        : "?scope=application"

    const response = await fetch(`/api/superadmin/users/${userId}${query}`, {
      method: "DELETE",
    })

    if (!response.ok) return

    if (activeTab === "company") {
      await loadData("company", selectedCompanyId)
      return
    }

    await loadData("application")
  }

  const handleAddCompanyUser = async () => {
    const errors = {
      name: newCompanyUser.name.trim() ? undefined : "Podaj imie i nazwisko.",
      email: newCompanyUser.email.trim()
        ? isValidEmail(newCompanyUser.email.trim())
          ? undefined
          : "Niepoprawny adres email."
        : "Podaj adres email.",
      companyId: selectedCompanyId ? undefined : "Wybierz firme.",
    }

    setNewCompanyUserErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    const response = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "company",
        companyId: selectedCompanyId,
        ...newCompanyUser,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      if (payload?.error === 'Missing required fields') {
        setNewCompanyUserErrors({
          name: newCompanyUser.name.trim() ? undefined : "Podaj imie i nazwisko.",
          email: newCompanyUser.email.trim()
            ? isValidEmail(newCompanyUser.email.trim())
              ? undefined
              : "Niepoprawny adres email."
            : "Podaj adres email.",
        })
      }
      if (payload?.error === 'Missing companyId') {
        setNewCompanyUserErrors((prev) => ({ ...prev, companyId: "Wybierz firme." }))
      }
      return
    }

    setIsAddCompanyUserOpen(false)
    setNewCompanyUser({
      name: "",
      email: "",
      department: "",
    })
    setNewCompanyUserErrors({})
    await loadData("company", selectedCompanyId)
  }

  const handleAddSuperadmin = async () => {
    const errors = {
      name: newSuperadmin.name.trim() ? undefined : "Podaj imie i nazwisko.",
      email: newSuperadmin.email.trim()
        ? isValidEmail(newSuperadmin.email.trim())
          ? undefined
          : "Niepoprawny adres email."
        : "Podaj adres email.",
    }

    setNewSuperadminErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    const response = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "application",
        ...newSuperadmin,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      if (payload?.error === 'Missing required fields') {
        setNewSuperadminErrors({
          name: newSuperadmin.name.trim() ? undefined : "Podaj imie i nazwisko.",
          email: newSuperadmin.email.trim()
            ? isValidEmail(newSuperadmin.email.trim())
              ? undefined
              : "Niepoprawny adres email."
            : "Podaj adres email.",
        })
      }
      return
    }

    setIsAddSuperadminOpen(false)
    setNewSuperadmin({
      name: "",
      email: "",
      department: "Management",
    })
    setNewSuperadminErrors({})
    await loadData("application")
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Uzytkownicy</h1>
        <p className="text-muted-foreground mt-1">
          Zarzadzanie uzytkownikami firm i administratorami aplikacji.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextTab = value as "company" | "application"
          setActiveTab(nextTab)

          if (nextTab === "application") {
            void loadData("application")
            return
          }

          void loadData("company", selectedCompanyId || undefined)
        }}
      >
        <TabsList>
          <TabsTrigger value="company">Firmy</TabsTrigger>
          <TabsTrigger value="application">Aplikacja</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtr firmy</CardTitle>
              <CardDescription>Wybierz firme, aby zobaczyc jej uzytkownikow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Wybierz firme" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsAddCompanyUserOpen(true)}>Dodaj uzytkownika firmy</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista uzytkownikow firmy</CardTitle>
              <CardDescription>{companyUsers.length} uzytkownikow w wybranej firmie.</CardDescription>
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
                  {companyUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.status === "active" ? "text-emerald-600 border-emerald-500/30" : ""}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.role !== "admin" && (
                            <Button className="w-28" size="sm" variant="outline" onClick={() => handleUserUpdate(user.id, { role: "admin" })}>
                              Ustaw admin
                            </Button>
                          )}
                          {user.role === "admin" && (
                            <Button className="w-28" size="sm" variant="outline" onClick={() => handleUserUpdate(user.id, { role: "user" })}>
                              Ustaw user
                            </Button>
                          )}
                          <Button
                            className="w-28"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUserUpdate(user.id, {
                                status: user.status === "active" ? "inactive" : "active",
                              })
                            }
                          >
                            {user.status === "active" ? "Dezaktywuj" : "Aktywuj"}
                          </Button>
                          <Button className="w-28" size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                            Usun
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Superadmini aplikacji</CardTitle>
              <CardDescription>Zarzadzaj kontami globalnymi platformy.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <Button onClick={() => setIsAddSuperadminOpen(true)}>Dodaj superadmina</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista superadminow</CardTitle>
              <CardDescription>{applicationUsers.length} kont globalnych.</CardDescription>
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
                  {applicationUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">superadmin</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.status === "active" ? "text-emerald-600 border-emerald-500/30" : ""}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          className="w-28"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUserUpdate(user.id, {
                              status: user.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {user.status === "active" ? "Dezaktywuj" : "Aktywuj"}
                        </Button>
                        <Button className="w-28" size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                          Usun
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddCompanyUserOpen} onOpenChange={setIsAddCompanyUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj uzytkownika do firmy</DialogTitle>
            <DialogDescription>Nowe konto zostanie przypisane do wybranej firmy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FieldGroup>
              <Field data-invalid={Boolean(newCompanyUserErrors.name)}>
                <FieldLabel>Imie i nazwisko</FieldLabel>
                <Input
                  value={newCompanyUser.name}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewCompanyUser((prev) => ({ ...prev, name: value }))
                    setNewCompanyUserErrors((prev) => ({
                      ...prev,
                      name: value.trim() ? undefined : "Podaj imie i nazwisko.",
                    }))
                  }}
                />
                <FieldError>{newCompanyUserErrors.name}</FieldError>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={Boolean(newCompanyUserErrors.email)}>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={newCompanyUser.email}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewCompanyUser((prev) => ({ ...prev, email: value }))
                    setNewCompanyUserErrors((prev) => ({
                      ...prev,
                      email: value.trim()
                        ? isValidEmail(value.trim())
                          ? undefined
                          : "Niepoprawny adres email."
                        : "Podaj adres email.",
                    }))
                  }}
                />
                <FieldError>{newCompanyUserErrors.email}</FieldError>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Dzial</FieldLabel>
                <Input
                  value={newCompanyUser.department}
                  onChange={(event) => setNewCompanyUser({ ...newCompanyUser, department: event.target.value })}
                />
              </Field>
            </FieldGroup>
            {newCompanyUserErrors.companyId && <FieldError>{newCompanyUserErrors.companyId}</FieldError>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyUserOpen(false)}>Anuluj</Button>
            <Button onClick={handleAddCompanyUser}>Dodaj uzytkownika</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSuperadminOpen} onOpenChange={setIsAddSuperadminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj superadmina</DialogTitle>
            <DialogDescription>Konto otrzyma globalny dostep do calej aplikacji.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FieldGroup>
              <Field data-invalid={Boolean(newSuperadminErrors.name)}>
                <FieldLabel>Imie i nazwisko</FieldLabel>
                <Input
                  value={newSuperadmin.name}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewSuperadmin((prev) => ({ ...prev, name: value }))
                    setNewSuperadminErrors((prev) => ({
                      ...prev,
                      name: value.trim() ? undefined : "Podaj imie i nazwisko.",
                    }))
                  }}
                />
                <FieldError>{newSuperadminErrors.name}</FieldError>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field data-invalid={Boolean(newSuperadminErrors.email)}>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={newSuperadmin.email}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewSuperadmin((prev) => ({ ...prev, email: value }))
                    setNewSuperadminErrors((prev) => ({
                      ...prev,
                      email: value.trim()
                        ? isValidEmail(value.trim())
                          ? undefined
                          : "Niepoprawny adres email."
                        : "Podaj adres email.",
                    }))
                  }}
                />
                <FieldError>{newSuperadminErrors.email}</FieldError>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Dzial</FieldLabel>
                <Input
                  value={newSuperadmin.department}
                  onChange={(event) => setNewSuperadmin({ ...newSuperadmin, department: event.target.value })}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSuperadminOpen(false)}>Anuluj</Button>
            <Button onClick={handleAddSuperadmin}>Dodaj superadmina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
