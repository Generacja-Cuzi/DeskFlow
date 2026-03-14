"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
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
            <CardTitle>Utworz konto</CardTitle>
            <CardDescription>
              Wypelnij formularz, aby zarejestrowac sie w systemie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Imie</FieldLabel>
                    <Input placeholder="Jan" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nazwisko</FieldLabel>
                    <Input placeholder="Kowalski" />
                  </Field>
                </FieldGroup>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel>Email sluzbowy</FieldLabel>
                  <Input
                    type="email"
                    placeholder="jan.kowalski@firma.pl"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>Dzial</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz dzial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="sales">Sprzedaz</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finanse</SelectItem>
                      <SelectItem value="operations">Operacje</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>Haslo</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 znakow"
                      className="pr-10"
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

              <FieldGroup>
                <Field>
                  <FieldLabel>Powtorz haslo</FieldLabel>
                  <Input type="password" placeholder="Powtorz haslo" />
                </Field>
              </FieldGroup>

              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-1" />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Akceptuje{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Regulamin
                  </Link>{" "}
                  oraz{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Polityke prywatnosci
                  </Link>
                </label>
              </div>

              <Link href="/">
                <Button type="button" className="w-full">
                  Zarejestruj sie
                </Button>
              </Link>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Masz juz konto? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Zaloguj sie
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
