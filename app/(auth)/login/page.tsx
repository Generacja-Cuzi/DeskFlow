"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">DeskFlow</h1>
          <p className="text-muted-foreground">System rezerwacji biura</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Zaloguj sie</CardTitle>
            <CardDescription>
              Wprowadz dane logowania, aby uzyskac dostep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="jan.kowalski@firma.pl"
                    className="w-full"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>Haslo</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Wprowadz haslo"
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Zapamietaj mnie
                  </label>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:underline"
                >
                  Zapomniałes hasla?
                </Link>
              </div>

              <Link href="/">
                <Button type="button" className="w-full">
                  Zaloguj sie
                </Button>
              </Link>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Nie masz konta? </span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Zarejestruj sie
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Kontynuujac, akceptujesz{" "}
          <Link href="#" className="underline hover:text-foreground">
            Regulamin
          </Link>{" "}
          oraz{" "}
          <Link href="#" className="underline hover:text-foreground">
            Polityke prywatnosci
          </Link>
        </p>
      </div>
    </div>
  )
}
