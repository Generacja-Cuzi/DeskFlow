"use client"

import { useEffect, useMemo, useState } from "react"
import { CreditCard, Edit, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SubscriptionPackage = {
  id: string
  name: string
  price: number
  maxUsers: number
  maxResources: number
  active: boolean
  companiesCount: number
  mrrContribution: number
}

export default function SuperadminSubscriptionsPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([])
  const [totalMrr, setTotalMrr] = useState(0)
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    maxUsers: 1,
    maxResources: 100,
    active: true,
  })

  const loadPackages = async () => {
    const response = await fetch("/api/superadmin/subscriptions", { cache: "no-store" })

    if (!response.ok) {
      return
    }

    const payload = await response.json()
    setPackages(payload.packages || [])
    setTotalMrr(payload.totalMrr || 0)
  }

  useEffect(() => {
    loadPackages()
  }, [])

  const activePackagesCount = useMemo(
    () => packages.filter((pkg) => pkg.active).length,
    [packages]
  )

  const totalCompaniesAssigned = useMemo(
    () => packages.reduce((sum, pkg) => sum + pkg.companiesCount, 0),
    [packages]
  )

  const handleOpenEdit = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      price: pkg.price,
      maxUsers: pkg.maxUsers,
      maxResources: pkg.maxResources,
      active: pkg.active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPackage) {
      return
    }

    const response = await fetch(`/api/superadmin/subscriptions/${editingPackage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      return
    }

    setIsDialogOpen(false)
    setEditingPackage(null)
    await loadPackages()
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subskrypcje</h1>
        <p className="text-muted-foreground mt-1">
          Edytuj pakiety (cena i limity uzytkownikow) oraz kontroluj MRR platformy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Laczny MRR</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {totalMrr} PLN
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aktywne pakiety</p>
            <p className="text-2xl font-bold mt-1">{activePackagesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Firmy przypisane do pakietow</p>
            <p className="text-2xl font-bold mt-1">{totalCompaniesAssigned}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cennik pakietow
          </CardTitle>
          <CardDescription>
            MRR liczone jest jako suma: cena pakietu * liczba firm przypisanych do tego pakietu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pakiet</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Limit uzytkownikow</TableHead>
                <TableHead>Firmy</TableHead>
                <TableHead>MRR z pakietu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.price} PLN</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {pkg.maxUsers}
                    </span>
                  </TableCell>
                  <TableCell>{pkg.companiesCount}</TableCell>
                  <TableCell>{pkg.mrrContribution} PLN</TableCell>
                  <TableCell>
                    <Badge variant={pkg.active ? "default" : "secondary"}>
                      {pkg.active ? "Aktywny" : "Wylaczony"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(pkg)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edytuj
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edycja pakietu</DialogTitle>
            <DialogDescription>
              Zmien nazwe, cene miesieczna oraz limit uzytkownikow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nazwa pakietu</Label>
              <Input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Cena (PLN / miesiac)</Label>
              <Input
                type="number"
                min={0}
                value={formData.price}
                onChange={(event) => setFormData((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Maksymalna liczba uzytkownikow</Label>
              <Input
                type="number"
                min={1}
                value={formData.maxUsers}
                onChange={(event) => setFormData((prev) => ({ ...prev, maxUsers: Number(event.target.value) || 1 }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Aktywny pakiet</p>
                <p className="text-sm text-muted-foreground">Wylaczenie ukrywa pakiet przy tworzeniu nowych firm.</p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
