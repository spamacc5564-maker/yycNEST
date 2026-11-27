import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Sign up" }

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Get your top 3 Calgary communities in a few minutes."
    >
      <AuthForm mode="sign-up" />
    </AuthShell>
  )
}
