import type { ReactNode } from "react"
import { Logo } from "@/components/brand/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-sky px-4 py-12">
      <Logo />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By continuing you agree that YYC Nest results are informational only, not professional advice.
      </p>
    </main>
  )
}
