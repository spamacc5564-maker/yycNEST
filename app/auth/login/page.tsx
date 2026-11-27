import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Log in" }

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Log in to see your matches and shortlist.">
      <AuthForm mode="login" />
    </AuthShell>
  )
}
