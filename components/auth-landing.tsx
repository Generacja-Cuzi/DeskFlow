"use client"

import { SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

interface AuthLandingProps {
  title: string
  subtitle: string
  showAuthActions?: boolean
  showSignOutAction?: boolean
  statusMessage?: string
}

export function AuthLanding({
  title,
  subtitle,
  showAuthActions = true,
  showSignOutAction = false,
  statusMessage = "Brak przypisanej organizacji. Skontaktuj sie z administratorem firmy.",
}: AuthLandingProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_40%)]" />
      </div>

      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-2xl backdrop-blur md:p-12">
        <p className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300">
          DESKFLOW
        </p>

        <h1 className="mt-6 text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">{subtitle}</p>

        {showAuthActions ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SignInButton>
              <Button className="h-11 bg-cyan-500 px-6 text-slate-950 hover:bg-cyan-400">Zaloguj sie</Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline" className="h-11 border-slate-300 bg-white px-6 text-black hover:bg-slate-100 hover:text-black">
                Zarejestruj sie
              </Button>
            </SignUpButton>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              {statusMessage}
            </div>
            {showSignOutAction && (
              <SignOutButton>
                <Button variant="outline" className="h-11 border-slate-300 bg-white px-6 text-black hover:bg-slate-100 hover:text-black">
                  Wyloguj sie
                </Button>
              </SignOutButton>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-3 text-xs text-slate-400 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">Rezerwacje biurek i sal</div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">Wypozyczanie zasobow</div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">Panel administracyjny firmy</div>
        </div>
      </div>
    </div>
  )
}
