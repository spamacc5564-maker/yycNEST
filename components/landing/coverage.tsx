import { Info } from "lucide-react"
import { METRIC_ICONS } from "@/components/shared/metric-icons"
import type { MetricKey } from "@/lib/mock-data"

const ITEMS: { key: MetricKey; title: string; body: string }[] = [
  { key: "parks", title: "Parks", body: "Park count and hectares of green space" },
  { key: "recreation", title: "Recreation", body: "City rec centres, pools and arenas" },
  { key: "offLeash", title: "Off-leash dog areas", body: "Designated off-leash parks and trails" },
  { key: "schools", title: "Schools", body: "Public and Catholic school locations" },
  { key: "lrt", title: "LRT access", body: "Distance to the nearest CTrain station" },
]

export function Coverage() {
  return (
    <section aria-labelledby="coverage-title" className="bg-sky py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-success">What we cover</p>
          <h2 id="coverage-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Five factors, all from City of Calgary open data
          </h2>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ITEMS.map((item) => {
            const Icon = METRIC_ICONS[item.key]
            return (
              <li key={item.key} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          Safety and commute-time data are not included yet.
        </p>
      </div>
    </section>
  )
}
