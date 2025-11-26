"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LazyImage } from "@/components/lazy-image"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

export default function PitchDeckPage() {
  const rev = [
    { m: "Q1", coffee: 270_000, cabinets: 540_000, total: 810_000 },
    { m: "Q2", coffee: 300_000, cabinets: 600_000, total: 900_000 },
    { m: "Q3", coffee: 330_000, cabinets: 660_000, total: 990_000 },
    { m: "Q4", coffee: 360_000, cabinets: 720_000, total: 1_080_000 },
  ]
  const alloc = [
    { name: "Fit-out", value: 30 },
    { name: "Equipment", value: 20 },
    { name: "Inventory", value: 10 },
    { name: "Staffing", value: 20 },
    { name: "Marketing", value: 10 },
    { name: "Contingency", value: 10 },
  ]
  const market = [
    { segment: "TAM", value: 35_000_000_000 },
    { segment: "SAM", value: 3_500_000_000 },
    { segment: "SOM", value: 35_000_000 },
  ]
  const roi = [
    { m: "Month 1", pct: 2 },
    { m: "Month 3", pct: 7 },
    { m: "Month 6", pct: 15 },
    { m: "Month 9", pct: 24 },
    { m: "Month 12", pct: 36 },
    { m: "Month 18", pct: 58 },
    { m: "Month 24", pct: 85 },
  ]
  const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

  return (
    <main className="min-h-screen bg-background">
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">Pitch Deck: Kitchen Showroom + Coffee Shop</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">An investor-ready overview of the combined experiential showroom and specialty coffee model that drives UGC, foot traffic, consults, and premium cabinet sales.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact?topic=pitch-deck">Discuss Investment</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/proposal">View Proposal</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <LazyImage src="https://res.cloudinary.com/dbviya1rj/image/upload/v1763825938/puet0csuee6rftjktc3f.png" alt="Pitch deck cover" width={700} height={500} className="rounded-xl border" priority />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Problem</CardTitle>
              <CardDescription>Low conversion in traditional showrooms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2">
                <li>Average dwell time in cabinet showrooms is under 8 minutes, limiting consults and sales.</li>
                <li>Static displays fail to generate engaging content and social proof.</li>
                <li>Foot traffic fluctuates, with poor mechanisms to capture high-intent visitors.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Solution</CardTitle>
              <CardDescription>Showroom + specialty coffee hybrid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-muted-foreground">
                <div className="text-foreground font-medium">Value Proposition</div>
                <div>Experiential showroom paired with coffee hospitality that increases dwell time, sparks UGC, and converts visitors into premium cabinet sales.</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4"><div className="text-sm text-muted-foreground">Dwell time uplift</div><div className="text-2xl font-semibold text-foreground">2–3x</div></div>
                <div className="rounded-lg border p-4"><div className="text-sm text-muted-foreground">Consult booking rate</div><div className="text-2xl font-semibold text-foreground">6%–10%</div></div>
                <div className="rounded-lg border p-4"><div className="text-sm text-muted-foreground">Consult → sale</div><div className="text-2xl font-semibold text-foreground">25%–35%</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Market Opportunity</CardTitle>
              <CardDescription>Size and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={market} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0ea5e9" name="PH cabinetry + lifestyle retail (₱)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                TAM ≈ ₱35B; SAM ≈ ₱3.5B; SOM ≈ ₱35M in first-city rollout. Growth driven by lifestyle retail, cafe culture, and premium home improvement demand.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Revenue</CardTitle>
              <CardDescription>Coffee, cabinetry, and blended total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rev} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="coffee" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Coffee" />
                    <Line type="monotone" dataKey="cabinets" stroke="#10b981" strokeWidth={2} dot={false} name="Cabinets" />
                    <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Operations</CardTitle>
              <CardDescription>Layout, staffing, and SOPs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4"><div className="font-medium text-foreground mb-1">Showroom zones</div><div>Cabinet vignettes, consultation area, content corner</div></div>
                <div className="rounded-lg border p-4"><div className="font-medium text-foreground mb-1">Coffee bar</div><div>Espresso, grinders, refrigeration, POS</div></div>
                <div className="rounded-lg border p-4"><div className="font-medium text-foreground mb-1">Staffing</div><div>Baristas, showroom consultants, cross-training</div></div>
                <div className="rounded-lg border p-4"><div className="font-medium text-foreground mb-1">SOPs</div><div>UGC workflow, consult booking, CRM handoff</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Capital Allocation</CardTitle>
              <CardDescription>Use of funds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={alloc} dataKey="value" nameKey="name" outerRadius={100} label>
                      {alloc.map((entry, index) => (
                        <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Competitive Advantage</CardTitle>
              <CardDescription>Defensible differentiation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2">
                <li>Hospitality-led showroom that increases dwell time and UGC.</li>
                <li>Capital-efficient build-out with modular vignettes and flexible staffing.</li>
                <li>Data-driven consult funnel integrated with CRM.</li>
                <li>Repeatable blueprint for multi-location rollout.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Go-To-Market</CardTitle>
              <CardDescription>Launch and growth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2">
                <li>Opening event with UGC incentives</li>
                <li>Paid social targeting high-intent audiences</li>
                <li>Local partnerships and community presence</li>
                <li>Consult funnel optimization with CRM</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Financials</CardTitle>
              <CardDescription>Quarterly breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rev} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="coffee" fill="#0ea5e9" name="Coffee" />
                    <Bar dataKey="cabinets" fill="#10b981" name="Cabinets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-foreground">Team</h2>
            <p className="text-muted-foreground mt-2">Cross-functional team covering design, operations, coffee, and growth.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-md border bg-background/70 px-3 py-2">Design and showroom</div>
              <div className="rounded-md border bg-background/70 px-3 py-2">Coffee operations</div>
              <div className="rounded-md border bg-background/70 px-3 py-2">Marketing and UGC</div>
              <div className="rounded-md border bg-background/70 px-3 py-2">Consult and CRM</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-md border bg-background/70 px-3 py-2">Advisors: retail, hospitality</div>
              <div className="rounded-md border bg-background/70 px-3 py-2">Partners: equipment, materials</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <LazyImage src="https://res.cloudinary.com/dbviya1rj/image/upload/v1763825938/puet0csuee6rftjktc3f.png" alt="Team and operations" width={700} height={500} className="rounded-xl border" />
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Traction & Success Metrics</CardTitle>
              <CardDescription>Early signals and targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Avg dwell</div><div className="text-xl font-semibold text-foreground">18–24m</div></div>
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">UGC per day</div><div className="text-xl font-semibold text-foreground">25–40</div></div>
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Consults/mo</div><div className="text-xl font-semibold text-foreground">60–100</div></div>
                <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Close rate</div><div className="text-xl font-semibold text-foreground">25%–35%</div></div>
              </div>
              <div className="mt-2 text-sm">Targets calibrated to the first location; benchmarks improve with optimization and UGC flywheel.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Investor ROI & Incentives</CardTitle>
              <CardDescription>24-month projection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roi} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pct" stroke="#f59e0b" strokeWidth={2} dot={false} name="ROI (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Preferred returns with profit share on cabinet sales and coffee EBITDA.</li>
                <li>Convertible option at next location rollout with valuation cap.</li>
                <li>Priority participation in multi-location expansion.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Testimonials & Case Studies</CardTitle>
              <CardDescription>Proof points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <blockquote className="rounded-lg border p-4">
                <div className="text-sm">“The hospitality-led showroom kept us engaged. We booked a consult on the spot and finalized our premium kitchen within two weeks.”</div>
                <footer className="mt-2 text-xs">Residential Client, PH</footer>
              </blockquote>
              <blockquote className="rounded-lg border p-4">
                <div className="text-sm">“UGC from the space consistently outperformed standard posts, driving inbound inquiries from high-intent audiences.”</div>
                <footer className="mt-2 text-xs">Marketing Partner</footer>
              </blockquote>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Investment Ask</CardTitle>
              <CardDescription>Use of funds and urgency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2">
                <li>₱700,000–₱1,300,000 for fit-out, equipment, inventory, staffing, marketing, contingency.</li>
                <li>Immediate timeline: lease finalization, build-out, soft opening in 60–90 days.</li>
                <li>Milestones: UGC flywheel activation, consult funnel, first 100 premium cabinet leads.</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact?topic=investment">Start Conversation</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/proposal">View Full Proposal</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}