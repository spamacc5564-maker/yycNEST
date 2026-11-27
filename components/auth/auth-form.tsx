"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, MailCheck, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { GoogleIcon } from "@/components/auth/google-icon"
import { GithubIcon } from "@/components/auth/github-icon"
import { createClient } from "@/lib/supabase/client"

type Mode = "login" | "sign-up"
type Provider = "google" | "github"
type Errors = Partial<Record<"name" | "email" | "password", string>>

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [values, setValues] = useState({ name: "", email: "", password: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const isSignUp = mode === "sign-up"
  const busy = submitting || oauthLoading !== null

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "oauth") {
      setFormError("We couldn't finish signing you in. Please try again.")
    }
  }, [])

  function validate(): Errors {
    const next: Errors = {}
    if (isSignUp && values.name.trim().length < 2) next.name = "Tell us your name so we can personalise your report."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address."
    if (values.password.length < 8) next.password = "Use at least 8 characters."
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setNotice(null)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitting(true)
    const supabase = createClient()

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: { full_name: values.name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setSubmitting(false)
      if (error) {
        setFormError(error.message)
        return
      }
      if (data.session) {
        router.push("/app/new")
        router.refresh()
      } else {
        setNotice(`We sent a confirmation link to ${values.email.trim()}. Open it to finish creating your account.`)
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })
    if (error) {
      setSubmitting(false)
      setFormError(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email first. Check your inbox for the link."
          : "That email and password don't match. Try again or create an account.",
      )
      return
    }
    router.push("/app/new")
    router.refresh()
  }

  async function handleOAuth(provider: Provider) {
    setFormError(null)
    setNotice(null)
    setOauthLoading(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setOauthLoading(null)
      setFormError(`We couldn't start sign-in with ${provider === "google" ? "Google" : "GitHub"}. ${error.message}`)
    }
    // On success the browser is sent to the provider, so there is nothing more to do here.
  }

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        {formError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{isSignUp ? "Couldn't create your account" : "Couldn't log you in"}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <Alert>
            <MailCheck />
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        <Button type="button" variant="outline" size="lg" className="h-10" disabled={busy} onClick={() => handleOAuth("google")}>
          {oauthLoading === "google" ? <Spinner data-icon="inline-start" /> : <GoogleIcon data-icon="inline-start" />}
          Continue with Google
        </Button>
        <Button type="button" variant="outline" size="lg" className="h-10" disabled={busy} onClick={() => handleOAuth("github")}>
          {oauthLoading === "github" ? <Spinner data-icon="inline-start" /> : <GithubIcon data-icon="inline-start" />}
          Continue with GitHub
        </Button>
        <FieldSeparator>or with email</FieldSeparator>

        {isSignUp && (
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              className="h-10"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={!!errors.name || undefined}
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
        )}

        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!errors.email || undefined}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.password || undefined}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="h-10 pr-10"
              value={values.password}
              onChange={(e) => update("password", e.target.value)}
              aria-invalid={!!errors.password || undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {errors.password ? (
            <FieldError>{errors.password}</FieldError>
          ) : (
            isSignUp && <FieldDescription>At least 8 characters.</FieldDescription>
          )}
        </Field>

        <Button type="submit" size="lg" className="h-10" disabled={busy}>
          {submitting && <Spinner data-icon="inline-start" />}
          {isSignUp ? "Create account" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "New to YYC Nest? "}
          <Link
            href={isSignUp ? "/auth/login" : "/auth/sign-up"}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {isSignUp ? "Log in" : "Create an account"}
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
