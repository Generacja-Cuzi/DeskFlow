"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

export default function SuperadminUsersPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [users, setUsers] = useState<UserRow[]>([])

  const loadData = async (companyId?: string) => {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""
    const response = await fetch(`/api/superadmin/users${query}`, { cache: "no-store" })
    if (!response.ok) return

    const data = await response.json()
    setCompanies(data.companies || [])
    setSelectedCompanyId(data.selectedCompanyId || "")
    setUsers(data.users || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCompanyChange = async (companyId: string) => {
    await loadData(companyId)
  }

  const handleUserUpdate = async (userId: string, body: Partial<Pick<UserRow, "role" | "status" | "companyId">>) => {
    const response = await fetch(`/api/superadmin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) return
    await loadData(selectedCompanyId)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Uzytkownicy firm</h1>
        <p className="text-muted-foreground mt-1">
          Wybierz firme i zarzadzaj przypisanymi uzytkownikami.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtr firmy</CardTitle>
          <CardDescription>Wybierz firme, aby zobaczyc jej uzytkownikow.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista uzytkownikow</CardTitle>
          <CardDescription>{users.length} uzytkownikow w wybranej firmie.</CardDescription>
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
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "superadmin" ? "destructive" : user.role === "admin" ? "default" : "secondary"}>
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
                      {user.role !== "admin" && user.role !== "superadmin" && (
                        <Button size="sm" variant="outline" onClick={() => handleUserUpdate(user.id, { role: "admin" })}>
                          Ustaw admin
                        </Button>
                      )}
                      {user.role === "admin" && (
                        <Button size="sm" variant="outline" onClick={() => handleUserUpdate(user.id, { role: "user" })}>
                          Ustaw user
                        </Button>
                      )}
                      <Button
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
