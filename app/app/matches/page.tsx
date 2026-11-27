"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderClock, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { deleteReport, formatDate, loadReports, type SavedReport } from "@/lib/match-types"

export default function MyMatchesPage() {
  const [reports, setReports] = useState<SavedReport[] | null>(null)

  useEffect(() => {
    setReports(loadReports())
  }, [])

  function remove(id: string) {
    deleteReport(id)
    setReports(loadReports())
  }

  if (reports === null) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My matches</h1>
          <p className="mt-1 text-muted-foreground">Your past reports, newest first.</p>
        </div>
        <Button render={<Link href="/app/new" />} nativeButton={false}>
          <Plus /> New match
        </Button>
      </div>

      {reports.length === 0 ? (
        <Empty className="border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderClock />
            </EmptyMedia>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>Describe your life in Calgary and we will rank the communities that fit.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/app/new" />} nativeButton={false}>Start your first match</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(r.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{r.hasDog ? "Dog owner" : "No dog"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{r.commute === "drive" ? "Drives" : "Transit"}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-pretty">&ldquo;{r.inputText}&rdquo;</p>
                    <div className="flex flex-wrap gap-2">
                      {(r.response.results ?? []).map((c) => (
                        <Badge key={c.community} variant="secondary">
                          #{c.rank} {c.community}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" render={<Link href={`/app/match/${r.id}`} />} nativeButton={false}>
                      View report
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete this report">
                      <Trash2 />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
