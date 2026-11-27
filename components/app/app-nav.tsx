"use client"

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
import { CURRENT_USER } from "@/lib/mock-data"

const LINKS = [
  { href: "/app/new", label: "New match", icon: Plus },
  { href: "/app/matches", label: "My matches", icon: FolderClock },
]

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()

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
                <AvatarFallback className="bg-primary text-primary-foreground">{CURRENT_USER.initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <p className="font-medium text-foreground">{CURRENT_USER.name}</p>
                  <p className="truncate text-xs font-normal">{CURRENT_USER.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/app/matches")}>
                  <FolderClock />
                  My matches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
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
