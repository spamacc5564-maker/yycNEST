"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BadgeCheck, Dog, Dumbbell, GraduationCap, Info, TrainFront, Trees, TriangleAlert, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, getReport, type MatchResponse, type MatchResult, type SavedReport } from "@/lib/match-types"

type Median = MatchResponse["city_median"]

function facts(r: MatchResult, m: Median): { icon: LucideIcon; label: string; median: string }[] {
  return [
    { icon: Trees, label: `${r.metrics.parks} parks`, median: `City median ${m.park_count}` },
    { icon: Dumbbell, label: `${r.metrics.recreation_facilities} rec ${r.metrics.recreation_facilities === 1 ? "facility" : "facilities"}`, median: `City median ${m.rec_facility_count}` },
    { icon: Dog, label: `${r.metrics.off_leash_areas} off-leash ${r.metrics.off_leash_areas === 1 ? "area" : "areas"}`, median: `City median ${m.offleash_count}` },
    { icon: GraduationCap, label: `${r.metrics.schools} ${r.metrics.schools === 1 ? "school" : "schools"}`, median: `City median ${m.school_count}` },
    { icon: TrainFront, label: `${r.metrics.km_to_nearest_lrt} km to LRT`, median: `City median ${m.km_to_nearest_lrt} km` },
  ]
}

export default function MatchResultsPage() {
  const params = useParams<{ id: string }>()
  const [report, setReport] = useState<SavedReport | null | undefined>(undefined)

  useEffect(() => {
    setReport(getReport(params.id) ?? null)
  }, [params.id])

  if (report === undefined) {
    return <p className="text-muted-foreground">Loading your report…</p>
  }

  if (report === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t find that report</h1>
        <p className="text-muted-foreground">It may have been saved on a different device or browser.</p>
        <Button render={<Link href="/app/new" />} nativeButton={false}>Start a new match</Button>
      </div>
    )
  }

  const { response } = report
  const top = response.results ?? []

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDate(report.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{report.hasDog ? "Dog owner" : "No dog"}</span>
          <span aria-hidden="true">·</span>
          <span>{report.commute === "drive" ? "Drives" : "Takes transit"}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Your top {top.length} Calgary communities</h1>
        <p className="max-w-3xl text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">You said:</span> &ldquo;{report.inputText}&rdquo;
        </p>
        {response.profile?.summary && <p className="max-w-3xl text-pretty text-muted-foreground">{response.profile.summary}</p>}
      </div>

      {response.verified ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeCheck className="size-4 text-success" aria-hidden="true" />
          The Verifier agent checked every number in these explanations against City data.
        </p>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-highlight bg-background p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
          <div>
            <p className="font-medium">Some claims could not be fully verified</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {(response.verifier_issues ?? []).map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ol className="grid gap-6 lg:grid-cols-3">
        {top.map((r) => (
          <li key={r.community}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <Badge className="w-fit bg-highlight text-highlight-foreground">#{r.rank} match</Badge>
                    <CardTitle className="mt-2 text-xl">{r.community}</CardTitle>
                    <CardDescription>{r.headline}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-semibold text-primary tabular-nums">{Math.round(r.score)}</span>
                    <span className="text-xs text-muted-foreground">match score</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <span className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Match score ${Math.round(r.score)} out of 100`}>
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }} />
                </span>
                <p className="text-sm text-pretty">{r.why}</p>
                <ul className="flex flex-col gap-2" aria-label="Real numbers">
                  {facts(r, response.city_median).map((f) => (
                    <li key={f.label} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <f.icon className="size-4 text-success" aria-hidden="true" />
                        {f.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{f.median}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-lg border border-dashed p-3 text-sm">
                  <p className="font-medium">Trade-off</p>
                  <p className="mt-1 text-muted-foreground">{r.tradeoff}</p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>How we scored these</CardTitle>
          <CardDescription>The scoring is plain code. The agents read your profile and explain the result.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {response.branches?.length > 0 && (
            <ul className="flex flex-col gap-1">
              {response.branches.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          {response.trace?.length > 0 && (
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer font-medium">Agent trace</summary>
              <ul className="mt-3 flex flex-col gap-1 text-muted-foreground">
                {response.trace.map((t, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span>
                      <span className="font-medium text-foreground">{t.agent}</span>
                      {t.detail ? ` · ${t.detail}` : ""}
                    </span>
                    <span className="tabular-nums">{t.ms} ms</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="flex items-start gap-2 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {response.data_limits} LRT distance is measured from the centre of each community, so it is approximate.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/app/new" />} nativeButton={false}>Start a new match</Button>
        <Button variant="outline" render={<Link href="/app/matches" />} nativeButton={false}>
          My matches
        </Button>
      </div>
    </div>
  )
}
