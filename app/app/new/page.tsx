"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Car, CheckCircle2, Circle, Dog, Dumbbell, GraduationCap, TrainFront, Trees, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { newReportId, saveReport, type Commute, type MatchResponse } from "@/lib/match-types"

const EXAMPLES = [
  "Moving from Toronto with a husky. I drive. I want parks and a rec centre.",
  "No car, I take the train downtown. Want a gym nearby.",
  "Two kids starting elementary school and a lab. Lots of parks, please.",
]

const PRIORITIES = [
  { key: "parks", label: "Parks and green space", icon: Trees },
  { key: "recreation", label: "Recreation facilities", icon: Dumbbell },
  { key: "schools", label: "Schools", icon: GraduationCap },
] as const

const STEPS = [
  { agent: "Data", text: "Loading City of Calgary data" },
  { agent: "Profile", text: "Reading your profile" },
  { agent: "Ranking", text: "Scoring communities" },
  { agent: "Narrator", text: "Writing your explanations" },
  { agent: "Verifier", text: "Checking every number" },
]

export default function NewMatchPage() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [hasDog, setHasDog] = useState(false)
  const [commute, setCommute] = useState<Commute>("drive")
  const [priorities, setPriorities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  function togglePriority(key: string) {
    setPriorities((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (text.trim().length < 10) {
      setError("Tell us a little more about your life in Calgary (at least a sentence).")
      return
    }
    setError(null)
    setLoading(true)
    setStep(0)
    // The stepper is a progress indicator. The real per-agent timings appear on the results page.
    timer.current = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100)

    const extra = priorities.length
      ? ` Things that matter most to me: ${PRIORITIES.filter((p) => priorities.includes(p.key))
          .map((p) => p.label.toLowerCase())
          .join(", ")}.`
      : ""

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() + extra, hasDog, commute }),
      })
      const data = (await res.json()) as MatchResponse
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.")
      const id = newReportId()
      saveReport({ id, createdAt: new Date().toISOString(), inputText: text.trim(), hasDog, commute, response: data })
      router.push(`/app/match/${id}`)
    } catch (err) {
      if (timer.current) clearInterval(timer.current)
      setLoading(false)
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? `The matching service had a problem: ${err.message}. Please try again.`
          : "We couldn't reach the matching service. Check your connection and try again.",
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Finding your communities</h1>
          <p className="mt-1 text-muted-foreground">Four agents are working through 200+ Calgary communities. This takes a few seconds.</p>
        </div>
        <Card>
          <CardContent>
            <ol className="flex flex-col gap-4" aria-live="polite">
              {STEPS.map((s, i) => {
                const done = i < step
                const active = i === step
                return (
                  <li key={s.agent} className={cn("flex items-center gap-3 text-sm", !done && !active && "text-muted-foreground")}>
                    {done ? (
                      <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                    ) : active ? (
                      <Spinner className="size-5 text-primary" />
                    ) : (
                      <Circle className="size-5" aria-hidden="true" />
                    )}
                    <span>
                      <span className="font-medium">{s.agent} agent</span> · {s.text}
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Where should you live in Calgary?</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Describe your life in your own words. We rank Calgary communities using City open data and show the real numbers behind each pick.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your life</CardTitle>
            <CardDescription>Pets, how you get around, what you do on weekends.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Moving with a husky, I drive, I want parks and a rec centre."
              rows={4}
              aria-label="Describe your life in Calgary"
              maxLength={800}
            />
            <div className="flex flex-wrap gap-2" aria-label="Example descriptions">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  className="rounded-full border bg-background px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {ex}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>A few quick details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="dog" className="flex items-center gap-2 text-sm font-medium">
                <Dog className="size-4 text-success" aria-hidden="true" />
                I have a dog
              </label>
              <Switch id="dog" checked={hasDog} onCheckedChange={setHasDog} />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">How do you get around?</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Commute">
                {(
                  [
                    { value: "drive", label: "I drive", icon: Car },
                    { value: "transit", label: "I take transit", icon: TrainFront },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={commute === o.value}
                    onClick={() => setCommute(o.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      commute === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                    )}
                  >
                    <o.icon className="size-4" aria-hidden="true" />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">What matters most? <span className="font-normal text-muted-foreground">(optional)</span></p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Priorities">
                {PRIORITIES.map((p) => {
                  const on = priorities.includes(p.key)
                  return (
                    <button
                      key={p.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePriority(p.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        on ? "border-success bg-success text-success-foreground" : "bg-background hover:bg-muted",
                      )}
                    >
                      <p.icon className="size-4" aria-hidden="true" />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>We couldn&apos;t run your match</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" className="h-11 text-base">
            Find my communities
          </Button>
          <p className="text-xs text-muted-foreground">
            We use parks, recreation, off-leash areas, schools and LRT access. We do not cover safety, commute time, restaurants or housing prices.
          </p>
        </div>
      </form>
    </div>
  )
}
