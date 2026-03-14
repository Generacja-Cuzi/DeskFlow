"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CompanyOption = {
  companyId: string
  companyName: string
  role: string
  status: string
}

interface CompanyAccessGateProps {
  companies: CompanyOption[]
  mode?: "user" | "superadmin"
}

export function CompanyAccessGate({ companies, mode = "user" }: CompanyAccessGateProps) {
  const router = useRouter()
  const [isLoadingCompanyId, setIsLoadingCompanyId] = useState<string | null>(null)

  const handleSelectCompany = async (companyId: string) => {
    setIsLoadingCompanyId(companyId)

    const response = await fetch(mode === "superadmin" ? '/api/superadmin/impersonation' : '/api/auth/active-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })

    if (response.ok) {
      window.location.reload()
      return
    }

    setIsLoadingCompanyId(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Wybierz firme</CardTitle>
          <CardDescription>
            {mode === "superadmin"
              ? "To konto superadmina jest przypisane do firm. Wybierz firme albo przejdz do panelu superadmina."
              : "To konto ma dostep do wielu firm. Wybierz, do ktorej chcesz wejsc."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === "superadmin" && (
            <div className="rounded-lg border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Panel superadmina</p>
                <p className="text-sm text-muted-foreground">Zarzadzanie cala aplikacja.</p>
              </div>
              <Button variant="secondary" onClick={() => router.push('/superadmin')}>
                Przejdz do panelu
              </Button>
            </div>
          )}
          {companies.map((company) => (
            <div key={company.companyId} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{company.companyName}</p>
                <p className="text-sm text-muted-foreground">Rola: {company.role}</p>
              </div>
              <Button
                onClick={() => handleSelectCompany(company.companyId)}
                disabled={isLoadingCompanyId === company.companyId}
              >
                {isLoadingCompanyId === company.companyId ? 'Ladowanie...' : 'Wejdz'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
