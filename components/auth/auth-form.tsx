"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { GoogleIcon } from "@/components/auth/google-icon"

type Mode = "login" | "sign-up"
type Errors = Partial<Record<"name" | "email" | "password", string>>

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [values, setValues] = useState({ name: "", email: "", password: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isSignUp = mode === "sign-up"

  function validate(): Errors {
    const next: Errors = {}
    if (isSignUp && values.name.trim().length < 2) next.name = "Tell us your name so we can personalise your report."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address."
    if (values.password.length < 8) next.password = "Use at least 8 characters."
    return next
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitting(true)
    setTimeout(() => router.push("/app/new"), 700)
  }

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Button type="button" variant="outline" size="lg" className="h-10">
          <GoogleIcon data-icon="inline-start" />
          Continue with Google
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
            {!isSignUp && (
              <Link href="/auth/login" className="text-sm text-primary underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            )}
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

        <Button type="submit" size="lg" className="h-10" disabled={submitting}>
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
