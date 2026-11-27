import { Check, Minus } from "lucide-react"

const ROWS = [
  {
    feature: "Uses current City data",
    detail: "Pulled from the Calgary Open Data Portal, with the update date on every report.",
    generic: "Relies on whatever it saw during training.",
  },
  {
    feature: "Shows its numbers",
    detail: "Every claim comes with a count or distance you can check.",
    generic: "Gives general impressions without sources.",
  },
  {
    feature: "Verifies its own claims",
    detail: "A Verifier agent re-checks each number before you see it.",
    generic: "Can state outdated or invented facts confidently.",
  },
  {
    feature: "Saves your shortlist",
    detail: "Keep reports and compare communities side by side.",
    generic: "Answers disappear into a long chat history.",
  },
]

export function ChatGptComparison() {
  return (
    <section aria-labelledby="compare-title" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-success">Why not just ask ChatGPT?</p>
          <h2 id="compare-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A general chatbot guesses. YYC Nest shows its work.
          </h2>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border shadow-sm">
          <div className="hidden grid-cols-[1.2fr_1.5fr_1.5fr] bg-muted px-6 py-3 text-sm font-semibold md:grid">
            <span>What matters</span>
            <span className="text-primary">YYC Nest</span>
            <span className="text-muted-foreground">General AI chatbot</span>
          </div>
          <ul className="divide-y">
            {ROWS.map((row) => (
              <li key={row.feature} className="grid gap-3 bg-card px-6 py-5 md:grid-cols-[1.2fr_1.5fr_1.5fr] md:gap-6">
                <p className="font-semibold">{row.feature}</p>
                <p className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="YYC Nest:" />
                  {row.detail}
                </p>
                <p className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0" aria-label="General chatbot:" />
                  {row.generic}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
