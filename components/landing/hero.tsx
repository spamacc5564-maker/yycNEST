import Link from "next/link"
import { ArrowRight, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExampleResultCard } from "@/components/landing/example-result-card"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-sky">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Database className="size-3.5 text-success" aria-hidden="true" />
            Built on City of Calgary open data
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Find your Calgary community
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Tell us how you live in plain language. We match it to real City data on parks,
            recreation, off-leash areas, schools and LRT access, then show you the top 3
            communities with the numbers behind each pick.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="h-11 px-5 text-base" render={<Link href="/app/new" />} nativeButton={false}>
              Get my matches
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 bg-background px-5 text-base"
              render={<a href="#how-it-works" />}
              nativeButton={false}
            >
              See how it works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Free for employees whose company offers YYC Nest.</p>
        </div>
        <ExampleResultCard />
      </div>
    </section>
  )
}
