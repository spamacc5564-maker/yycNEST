import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Google, GitHub and email-confirmation links all return here with a one-time code.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/app/new"
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app/new"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth`)
}
