"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FolderClock, LogOut, Plus } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const LINKS = [
  { href: "/app/new", label: "New match", icon: Plus },
  { href: "/app/matches", label: "My matches", icon: FolderClock },
]

interface NavUser {
  name: string
  email: string
  initials: string
}

function toNavUser(u: { email?: string; user_metadata?: Record<string, unknown> }): NavUser {
  const email = u.email ?? ""
  const meta = u.user_metadata ?? {}
  const name = (meta.full_name as string) || (meta.name as string) || email.split("@")[0] || "Account"
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  return { name, email, initials }
}

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<NavUser | null>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setUser(toNavUser(data.user))
      })
  }, [])

  async function logOut() {
    await createClient().auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <nav aria-label="App" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href="/app/new" />
        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active && "bg-muted text-foreground",
                )}
              >
                <link.icon className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{link.label}</span>
              </Link>
            )
          })}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-1 rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label="Open user menu"
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">{user?.initials ?? "…"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <p className="font-medium text-foreground">{user?.name ?? "Loading…"}</p>
                  <p className="truncate text-xs font-normal">{user?.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/app/matches")}>
                  <FolderClock />
                  My matches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logOut}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
