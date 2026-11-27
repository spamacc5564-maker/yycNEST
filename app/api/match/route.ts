import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"
const FALLBACK_MODEL = "gemini-2.5-flash"

// ---------- Types ----------
type Weights = { parks: number; rec: number; offleash: number; schools: number; lrt: number }
type Row = {
  community_name: string
  park_count: number
  rec_facility_count: number
  offleash_count: number
  school_count: number
  km_to_nearest_lrt: number | null
}
type Scored = Row & { score: number }
type MatchInput = {
  text: string
  hasDog?: boolean
  commute?: "drive" | "transit" | "both"
  priorities?: Partial<Weights>
}
type TraceStep = { agent: string; status: string; ms: number; detail?: string }

const DATA_LIMITS =
  "This tool uses City of Calgary open data on parks, recreation facilities, off-leash areas, schools and LRT access. It does not cover safety, commute time, restaurants, or housing prices."

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
  const v = Number(n)
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("Model did not return JSON")
  return JSON.parse(cleaned.slice(start, end + 1)) as T
}

function partsOf(data: any): any[] {
  const parts = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || "no content"
    throw new Error("Gemini returned no content (" + reason + ")")
  }
  return parts
}

function textOf(data: any): string {
  return partsOf(data)
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("\n")
}

async function callGemini(opts: {
  system: string
  contents: any[]
  tools?: any[]
  json?: boolean
  maxTokens?: number
}) {
  const models = Array.from(new Set([PRIMARY_MODEL, FALLBACK_MODEL]))
  let lastErr = "Gemini call failed"
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(GEMINI_BASE + "/" + model + ":generateContent", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY || "",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: opts.contents,
          ...(opts.tools ? { tools: opts.tools } : {}),
          generationConfig: {
            maxOutputTokens: opts.maxTokens ?? 4096,
            ...(opts.json && !opts.tools ? { responseMimeType: "application/json" } : {}),
          },
        }),
      })
      if (res.ok) return res.json()
      const body = await res.text()
      lastErr = "Gemini " + res.status + " (" + model + "): " + body.slice(0, 300)
      if (res.status === 404) break // model name not available, try the next model
      if (res.status === 429 || res.status >= 500) {
        await sleep(3000 * (attempt + 1))
        continue
      }
      throw new Error(lastErr)
    }
  }
  throw new Error(lastErr)
}

const userMsg = (text: string) => [{ role: "user", parts: [{ text }] }]

async function loadMetrics(): Promise<Row[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars are missing")
  const headers: Record<string, string> = { apikey: key }
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key
  const res = await fetch(url + "/rest/v1/community_metrics?select=*&limit=1000", { headers })
  if (!res.ok) throw new Error("Supabase " + res.status + ": " + (await res.text()).slice(0, 300))
  const rows = (await res.json()) as Row[]
  if (!rows.length) throw new Error("community_metrics is empty")
  return rows
}

// ---------- Ranking tool (deterministic scoring) ----------
function percentile(sorted: number[], v: number) {
  let below = 0
  let equal = 0
  for (const x of sorted) {
    if (x < v) below++
    else if (x === v) equal++
  }
  return (below + 0.5 * equal) / sorted.length
}

function scoreCommunities(rows: Row[], w: Weights): Scored[] {
  const col = (f: (r: Row) => number) => rows.map(f).sort((a, b) => a - b)
  const parks = col((r) => r.park_count)
  const rec = col((r) => r.rec_facility_count)
  const off = col((r) => r.offleash_count)
  const sch = col((r) => r.school_count)
  const lrt = col((r) => r.km_to_nearest_lrt ?? 999)
  const total = w.parks + w.rec + w.offleash + w.schools + w.lrt || 1
  return rows
    .map((r) => {
      const s =
        w.parks * percentile(parks, r.park_count) +
        w.rec * percentile(rec, r.rec_facility_count) +
        w.offleash * percentile(off, r.offleash_count) +
        w.schools * percentile(sch, r.school_count) +
        w.lrt * (1 - percentile(lrt, r.km_to_nearest_lrt ?? 999))
      return { ...r, score: Math.round((s / total) * 1000) / 10 }
    })
    .sort((a, b) => b.score - a.score)
}

function medians(rows: Row[]) {
  const med = (f: (r: Row) => number) => {
    const a = rows.map(f).sort((x, y) => x - y)
    return a[Math.floor(a.length / 2)]
  }
  return {
    park_count: med((r) => r.park_count),
    rec_facility_count: med((r) => r.rec_facility_count),
    offleash_count: med((r) => r.offleash_count),
    school_count: med((r) => r.school_count),
    km_to_nearest_lrt: Math.round(med((r) => r.km_to_nearest_lrt ?? 0) * 100) / 100,
  }
}

// ---------- Agent 1: Profile ----------
async function profileAgent(input: MatchInput) {
  const data = await callGemini({
    system:
      "You are the Profile agent for YYC Nest, a tool that matches relocating employees to Calgary communities. " +
      "Read the person's description and return ONLY a JSON object with this shape: " +
      '{"has_dog":boolean,"commute_mode":"drive"|"transit"|"both","has_kids":boolean,' +
      '"weights":{"parks":0-10,"rec":0-10,"offleash":0-10,"schools":0-10,"lrt":0-10},' +
      '"summary":"one plain sentence describing what this person wants"}. ' +
      "Weights express how much each measurable factor matters to them (parks, recreation facilities, off-leash dog areas, schools, LRT access). " +
      "Use 5 for a factor they did not mention. Do not invent facts they did not state.",
    contents: userMsg(
      JSON.stringify({
        description: input.text,
        form: { hasDog: input.hasDog, commute: input.commute, priorities: input.priorities },
      })
    ),
    json: true,
  })
  return parseJson<{
    has_dog: boolean
    commute_mode: "drive" | "transit" | "both"
    has_kids: boolean
    weights: Weights
    summary: string
  }>(textOf(data))
}

// ---------- Agent 2: Ranking (tool use) ----------
async function rankingAgent(rows: Row[], profile: any, weights: Weights) {
  const tools = [
    {
      functionDeclarations: [
        {
          name: "rank_communities",
          description:
            "Scores every Calgary community in the database using the given 0-10 weights and returns the top 10 with their real metrics.",
          parameters: {
            type: "OBJECT",
            properties: {
              weights: {
                type: "OBJECT",
                properties: {
                  parks: { type: "NUMBER" },
                  rec: { type: "NUMBER" },
                  offleash: { type: "NUMBER" },
                  schools: { type: "NUMBER" },
                  lrt: { type: "NUMBER" },
                },
                required: ["parks", "rec", "offleash", "schools", "lrt"],
              },
            },
            required: ["weights"],
          },
        },
      ],
    },
  ]
  const contents: any[] = userMsg(
    "Profile: " +
      JSON.stringify(profile) +
      "\nFinal weights to use: " +
      JSON.stringify(weights) +
      '\nCall rank_communities once with exactly these weights. Then choose the best 3 communities from the returned top 10. Keep the score order unless the profile clearly justifies a different pick using the data. Reply ONLY with JSON: {"top3":["name","name","name"]}'
  )
  let top10: Scored[] = []
  let toolCalls = 0
  for (let i = 0; i < 3; i++) {
    const data = await callGemini({
      system:
        "You are the Ranking agent for YYC Nest. You must use the rank_communities tool to see real data. Never invent community names.",
      contents,
      tools,
    })
    const parts = partsOf(data)
    const calls = parts.filter((p) => p.functionCall)
    if (calls.length) {
      contents.push({ role: "model", parts })
      const responses = calls.map((c) => {
        toolCalls++
        top10 = scoreCommunities(rows, weights).slice(0, 10)
        return { functionResponse: { name: c.functionCall.name, response: { top10 } } }
      })
      contents.push({ role: "user", parts: responses })
      continue
    }
    try {
      const picked = parseJson<{ top3: string[] }>(textOf(data)).top3
      const valid = picked.filter((n) => top10.some((r) => r.community_name === n))
      const unique = Array.from(new Set(valid))
      if (unique.length === 3) {
        return {
          top3: unique.map((n) => top10.find((r) => r.community_name === n)!),
          toolCalls,
          fallback: false,
        }
      }
    } catch {}
    break
  }
  // Branch: agent output was unusable, so fall back to pure score order.
  const fallback = scoreCommunities(rows, weights).slice(0, 3)
  return { top3: fallback, toolCalls, fallback: true }
}

// ---------- Agent 3: Narrator ----------
async function narratorAgent(profile: any, top3: Scored[], med: any, issues?: any[]) {
  const data = await callGemini({
    system:
      "You are the Narrator agent for YYC Nest. Voice: friendly, plain, evidence-first. " +
      "Explain why each community fits this person. Use ONLY numbers that appear in the data you are given " +
      "(the community's own metrics, its score, or the city median). Never mention safety, crime, commute times, restaurants, " +
      "prices, or anything not in the data. Never say a community has a feature the data does not show. " +
      "Return ONLY JSON: " +
      '{"communities":[{"community":"exact name","headline":"max 12 words","why":"2-3 sentences with real numbers","tradeoff":"1 sentence honest limitation based on the data"}]}',
    contents: userMsg(
      JSON.stringify({
        profile,
        top3,
        city_median: med,
        fix_these_problems_from_the_verifier: issues || [],
      })
    ),
    json: true,
  })
  return parseJson<{
    communities: { community: string; headline: string; why: string; tradeoff: string }[]
  }>(textOf(data))
}

// ---------- Agent 4: Verifier ----------
async function verifierAgent(narration: any, top3: Scored[], med: any) {
  const data = await callGemini({
    system:
      "You are the Verifier agent for YYC Nest. Check every number and factual claim in the narration against the data rows and city medians. " +
      "A claim fails if a number does not match the data (rounding to the same value is fine), if it states a feature the data does not show, " +
      "or if it mentions safety, commute time, restaurants, or prices. Return ONLY JSON: " +
      '{"ok":boolean,"issues":[{"community":"name","claim":"the claim","problem":"what is wrong","fix":"what the data actually says"}]}',
    contents: userMsg(JSON.stringify({ narration, rows: top3, city_median: med })),
    json: true,
  })
  return parseJson<{ ok: boolean; issues: any[] }>(textOf(data))
}

// ---------- Orchestrator ----------
async function runMatch(input: MatchInput) {
  const trace: TraceStep[] = []
  const branches: string[] = []
  const timed = async <T,>(agent: string, fn: () => Promise<T>, detail?: (r: T) => string) => {
    const t = Date.now()
    const r = await fn()
    trace.push({ agent, status: "done", ms: Date.now() - t, detail: detail?.(r) })
    return r
  }

  const rows = await timed("Data", loadMetrics, (r) => r.length + " communities loaded")
  const profile = await timed("Profile", () => profileAgent(input), (p) => p.summary)

  // Merge form inputs over the AI's reading of the text.
  const hasDog = input.hasDog ?? profile.has_dog
  const commute = input.commute ?? profile.commute_mode
  const w: Weights = { parks: 5, rec: 5, offleash: 5, schools: 5, lrt: 5 }
  for (const k of Object.keys(w) as (keyof Weights)[]) {
    w[k] = clamp(input.priorities?.[k] ?? profile.weights?.[k], 0, 10, 5)
  }

  // Branch A: dog owners care a lot about off-leash areas.
  if (hasDog) {
    w.offleash = Math.min(10, Math.max(w.offleash + 3, 7))
    branches.push("A: dog owner, off-leash weight raised to " + w.offleash)
  }
  // Branch B: transit users depend on LRT; drivers barely do.
  if (commute === "transit") {
    w.lrt = Math.max(w.lrt, 9)
    branches.push("B: transit user, LRT weight raised to " + w.lrt)
  } else if (commute === "drive") {
    w.lrt = Math.min(w.lrt, 2)
    branches.push("B: drives, LRT weight lowered to " + w.lrt)
  }

  const med = medians(rows)
  const ranked = await timed(
    "Ranking",
    () => rankingAgent(rows, { ...profile, has_dog: hasDog, commute_mode: commute }, w),
    (r) => r.toolCalls + " tool call(s)" + (r.fallback ? ", used score-order fallback" : "")
  )
  if (ranked.fallback) branches.push("C: ranking agent output unusable, fell back to score order")
  const top3 = ranked.top3

  const profileForNarration = { ...profile, has_dog: hasDog, commute_mode: commute, weights: w }
  let narration = await timed("Narrator", () => narratorAgent(profileForNarration, top3, med))
  let verdict = await timed("Verifier", () => verifierAgent(narration, top3, med), (v) =>
    v.ok ? "all claims verified" : v.issues.length + " issue(s) found"
  )

  // Branch D: verifier found problems, so the narrator rewrites once and it is re-checked.
  if (!verdict.ok) {
    branches.push("D: verifier flagged " + verdict.issues.length + " issue(s), narration rewritten")
    narration = await timed("Narrator (revision)", () =>
      narratorAgent(profileForNarration, top3, med, verdict.issues)
    )
    verdict = await timed("Verifier (recheck)", () => verifierAgent(narration, top3, med), (v) =>
      v.ok ? "all claims verified" : v.issues.length + " issue(s) remain"
    )
  }

  const results = top3.map((r, i) => {
    const n = narration.communities.find((c) => c.community === r.community_name) || narration.communities[i]
    return {
      rank: i + 1,
      community: r.community_name,
      score: r.score,
      metrics: {
        parks: r.park_count,
        recreation_facilities: r.rec_facility_count,
        off_leash_areas: r.offleash_count,
        schools: r.school_count,
        km_to_nearest_lrt: r.km_to_nearest_lrt === null ? null : Math.round(r.km_to_nearest_lrt * 100) / 100,
      },
      headline: n?.headline,
      why: n?.why,
      tradeoff: n?.tradeoff,
    }
  })

  return {
    ok: true,
    profile: { ...profile, has_dog: hasDog, commute_mode: commute },
    weights: w,
    branches,
    city_median: med,
    results,
    verified: verdict.ok,
    verifier_issues: verdict.ok ? [] : verdict.issues,
    data_limits: DATA_LIMITS,
    trace,
  }
}

// ---------- Routes ----------
function missingEnv() {
  return process.env.GEMINI_API_KEY ? null : "GEMINI_API_KEY is not set"
}

export async function POST(req: Request) {
  try {
    const m = missingEnv()
    if (m) return NextResponse.json({ ok: false, error: m }, { status: 500 })
    const body = (await req.json()) as MatchInput
    if (!body.text || typeof body.text !== "string" || body.text.length > 2000) {
      return NextResponse.json({ ok: false, error: "text is required (max 2000 characters)" }, { status: 400 })
    }
    return NextResponse.json(await runMatch(body))
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

// Temporary browser-test route, protected by INGEST_SECRET. Remove once the UI is connected (step 4).
// Example: /api/match?secret=...&q=moving with a husky, I drive&dog=1&commute=drive
// Speed test: /api/match?secret=...&ping=1
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    if (!process.env.INGEST_SECRET || url.searchParams.get("secret") !== process.env.INGEST_SECRET) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
    const m = missingEnv()
    if (m) return NextResponse.json({ ok: false, error: m }, { status: 500 })
    if (url.searchParams.get("ping") === "1") {
      const t = Date.now()
      const data = await callGemini({
        system: "Reply with the single word ok.",
        contents: userMsg("ping"),
        maxTokens: 512,
      })
      return NextResponse.json({ ok: true, ms: Date.now() - t, model: PRIMARY_MODEL, reply: textOf(data) })
    }
    const commute = url.searchParams.get("commute") as MatchInput["commute"] | null
    const dog = url.searchParams.get("dog")
    return NextResponse.json(
      await runMatch({
        text: url.searchParams.get("q") || "I want parks and a rec centre",
        hasDog: dog === null ? undefined : dog === "1",
        commute: commute || undefined,
      })
    )
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
