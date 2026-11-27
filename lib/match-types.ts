// Types and browser-storage helpers for real match results.
// Reports are kept in this browser (localStorage) for now.
// In the "save reports" step we switch this to the Supabase `reports` table.

export type Commute = "drive" | "transit"

export interface MatchMetrics {
  parks: number
  recreation_facilities: number
  off_leash_areas: number
  schools: number
  km_to_nearest_lrt: number
}

export interface MatchResult {
  rank: number
  community: string
  score: number
  metrics: MatchMetrics
  headline: string
  why: string
  tradeoff: string
}

export interface TraceStep {
  agent: string
  status: string
  ms: number
  detail?: string
}

export interface MatchResponse {
  ok: boolean
  error?: string
  profile: {
    has_dog: boolean
    commute_mode: string
    has_kids: boolean
    weights: Record<string, number>
    summary: string
  }
  weights: Record<string, number>
  branches: string[]
  city_median: {
    park_count: number
    rec_facility_count: number
    offleash_count: number
    school_count: number
    km_to_nearest_lrt: number
  }
  results: MatchResult[]
  verified: boolean
  verifier_issues: string[]
  data_limits: string
  trace: TraceStep[]
}

export interface SavedReport {
  id: string
  createdAt: string
  inputText: string
  hasDog: boolean
  commute: Commute
  response: MatchResponse
}

const KEY = "yycnest:reports"

export function loadReports(): SavedReport[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedReport[]) : []
  } catch {
    return []
  }
}

export function saveReport(report: SavedReport) {
  try {
    const all = loadReports().filter((r) => r.id !== report.id)
    window.localStorage.setItem(KEY, JSON.stringify([report, ...all].slice(0, 30)))
  } catch {
    // storage full or blocked: the results page will say it could not find the report
  }
}

export function getReport(id: string): SavedReport | undefined {
  return loadReports().find((r) => r.id === id)
}

export function deleteReport(id: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loadReports().filter((r) => r.id !== id)))
  } catch {
    // ignore
  }
}

export function newReportId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
}
