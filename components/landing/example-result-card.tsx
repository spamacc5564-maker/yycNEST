import { BadgeCheck, Dog, Dumbbell, TrainFront, Trees } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FACTS = [
  { icon: Trees, label: "14 parks" },
  { icon: Dumbbell, label: "3 rec facilities" },
  { icon: Dog, label: "2 off-leash areas" },
  { icon: TrainFront, label: "0.6 km to LRT" },
]

const BARS = [
  { label: "Parks", value: 94 },
  { label: "Off-leash", value: 88 },
  { label: "Recreation", value: 90 },
]

export function ExampleResultCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -top-4 -left-4 hidden rounded-2xl border bg-background px-4 py-3 text-sm shadow-sm sm:block">
        <p className="text-muted-foreground">You said</p>
        <p className="font-medium">{'"Moving with a husky, I drive."'}</p>
      </div>
      <Card className="shadow-lg sm:mt-10">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Badge className="w-fit bg-highlight text-highlight-foreground">#1 match</Badge>
              <CardTitle className="mt-2 text-xl">Bridgeland-Riverside</CardTitle>
              <CardDescription>Northeast · along the Bow River</CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-semibold text-primary">92</span>
              <span className="text-xs text-muted-foreground">match score</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ul className="flex flex-col gap-3" aria-label="Score breakdown">
            {BARS.map((bar) => (
              <li key={bar.label} className="grid grid-cols-[80px_1fr_28px] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{bar.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${bar.value}%` }} />
                </span>
                <span className="text-right font-medium tabular-nums">{bar.value}</span>
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-2 gap-2" aria-label="Real numbers">
            {FACTS.map((fact) => (
              <li key={fact.label} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <fact.icon className="size-4 text-success" aria-hidden="true" />
                {fact.label}
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BadgeCheck className="size-4 text-success" aria-hidden="true" />
            Verifier agent checked all 27 claims against City data
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
