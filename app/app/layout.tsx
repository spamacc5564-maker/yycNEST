import type { ReactNode } from "react"
import { AppNav } from "@/components/app/app-nav"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-sky">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="border-t bg-background">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          Contains data from the City of Calgary Open Data Portal. Informational only, not professional advice.
        </p>
      </footer>
    </div>
  )
}
