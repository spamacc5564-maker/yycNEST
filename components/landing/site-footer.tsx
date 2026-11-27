import { Logo } from "@/components/brand/logo"

export function SiteFooter() {
  return (
    <footer className="border-t bg-sky">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Logo />
        <div className="flex flex-col gap-1 text-sm text-muted-foreground md:text-right">
          <p>Contains data from the City of Calgary Open Data Portal.</p>
          <p>Informational only, not professional advice.</p>
          <p>{"© 2026 YYC Nest"}</p>
        </div>
      </div>
    </footer>
  )
}
