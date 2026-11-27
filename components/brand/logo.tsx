import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="20" fill="#1F5F8B" />
      <path d="M10 19.5 20 11l10 8.5V29a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 10 29v-9.5Z" fill="#FFFFFF" />
      <path d="M8.5 20.2 20 10.4l11.5 9.8" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17" y="21.5" width="6" height="9" rx="1.2" fill="#2E8B6E" />
      <circle cx="27.5" cy="12.5" r="3.2" fill="#E8A33D" stroke="#1F5F8B" strokeWidth="1.2" />
    </svg>
  )
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg font-semibold tracking-tight text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
      aria-label="YYC Nest home"
    >
      <LogoMark />
      <span className="text-lg">
        YYC <span className="text-primary">Nest</span>
      </span>
    </Link>
  )
}
