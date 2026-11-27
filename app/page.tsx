import { SiteNavbar } from "@/components/landing/site-navbar"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Coverage } from "@/components/landing/coverage"
import { ChatGptComparison } from "@/components/landing/chatgpt-comparison"
import { ForEmployers } from "@/components/landing/for-employers"
import { SiteFooter } from "@/components/landing/site-footer"

export default function HomePage() {
  return (
    <>
      <SiteNavbar />
      <main>
        <Hero />
        <HowItWorks />
        <Coverage />
        <ChatGptComparison />
        <ForEmployers />
      </main>
      <SiteFooter />
    </>
  )
}
