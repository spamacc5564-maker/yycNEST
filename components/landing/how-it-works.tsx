import { MessageSquareText, Sparkles, ListOrdered } from "lucide-react"

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Describe your life",
    body: "Write a sentence or two about your household, how you get around and what you want nearby. No forms full of checkboxes.",
  },
  {
    icon: Sparkles,
    title: "Four AI agents score every community",
    body: "Profile, Ranking, Narrator and Verifier agents read your needs and score 200+ Calgary communities against City open data.",
  },
  {
    icon: ListOrdered,
    title: "Get your top 3 with the numbers",
    body: "See why each community fits, the real counts behind it and the trade-off you should know about before you visit.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-success">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From a few sentences to a shortlist you can trust
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
