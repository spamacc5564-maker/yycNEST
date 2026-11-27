"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, Clock, HeartHandshake, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

const POINTS = [
  { icon: Clock, text: "New hires shortlist communities before their first house-hunting trip." },
  { icon: Users, text: "One perk for every relocating employee, no setup on their side." },
  { icon: HeartHandshake, text: "A warmer welcome to Calgary that shows you thought about their life, not just the job." },
]

export function ForEmployers() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid work email, like name@company.com.")
      return
    }
    setError(null)
    setJoined(true)
  }

  return (
    <section id="for-employers" aria-labelledby="employers-title" className="scroll-mt-20 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-highlight">For employers</p>
            <h2 id="employers-title" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Give your new hires a head start.
            </h2>
            <p className="leading-relaxed text-primary-foreground/85">
              Add YYC Nest to your relocation package. Employees get evidence-based community
              recommendations in minutes, so they arrive knowing where they want to live.
            </p>
            <ul className="mt-2 flex flex-col gap-3">
              {POINTS.map((p) => (
                <li key={p.text} className="flex gap-3 text-sm leading-relaxed">
                  <p.icon className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-background p-6 text-foreground shadow-lg">
            {joined ? (
              <div role="status" className="flex flex-col items-start gap-3">
                <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{"You're on the list"}</h3>
                <p className="text-sm text-muted-foreground">
                  We will email {email} when employer accounts open in early 2027.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Join the employer waitlist</h3>
                <Field data-invalid={!!error || undefined}>
                  <FieldLabel htmlFor="waitlist-email">Work email</FieldLabel>
                  <Input
                    id="waitlist-email"
                    type="email"
                    autoComplete="email"
                    placeholder="hr@yourcompany.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error || undefined}
                    className="h-10"
                  />
                  {error && <FieldError>{error}</FieldError>}
                </Field>
                <Button type="submit" size="lg" className="h-10">
                  Join the waitlist
                </Button>
                <p className="text-xs text-muted-foreground">No spam. One email when we launch.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
