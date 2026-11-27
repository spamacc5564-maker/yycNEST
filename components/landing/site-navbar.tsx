"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-employers", label: "For employers" },
]

export function SiteNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="lg" render={<Link href="/auth/login" />} nativeButton={false}>
            Log in
          </Button>
          <Button size="lg" className="px-4" render={<Link href="/auth/sign-up" />} nativeButton={false}>
            Sign up
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </nav>
      {open && (
        <div id="mobile-nav" className="border-t bg-background px-4 pb-4 md:hidden">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md py-3 text-base font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" render={<Link href="/auth/login" />} nativeButton={false}>
              Log in
            </Button>
            <Button size="lg" render={<Link href="/auth/sign-up" />} nativeButton={false}>
              Sign up
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
