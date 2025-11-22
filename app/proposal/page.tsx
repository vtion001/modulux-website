"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LazyImage } from "@/components/lazy-image"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

export default function ProposalPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const revenueData = [
    { m: "Jan", coffee: 85_000, cabinets: 150_000, total: 235_000 },
    { m: "Feb", coffee: 90_000, cabinets: 160_000, total: 250_000 },
    { m: "Mar", coffee: 95_000, cabinets: 180_000, total: 275_000 },
    { m: "Apr", coffee: 100_000, cabinets: 200_000, total: 300_000 },
    { m: "May", coffee: 105_000, cabinets: 220_000, total: 325_000 },
    { m: "Jun", coffee: 110_000, cabinets: 240_000, total: 350_000 },
    { m: "Jul", coffee: 115_000, cabinets: 260_000, total: 375_000 },
    { m: "Aug", coffee: 120_000, cabinets: 280_000, total: 400_000 },
    { m: "Sep", coffee: 125_000, cabinets: 300_000, total: 425_000 },
    { m: "Oct", coffee: 130_000, cabinets: 320_000, total: 450_000 },
    { m: "Nov", coffee: 135_000, cabinets: 340_000, total: 475_000 },
    { m: "Dec", coffee: 140_000, cabinets: 360_000, total: 500_000 },
  ]

  const marketData = [
    { name: "TAM", value: 35_000_000_000 },
    { name: "SAM", value: 3_500_000_000 },
    { name: "SOM", value: 35_000_000 },
  ]

  const allocationData = [
    { name: "Fit-out", value: 30 },
    { name: "Equipment", value: 20 },
    { name: "Inventory", value: 10 },
    { name: "Staffing", value: 20 },
    { name: "Marketing", value: 10 },
    { name: "Contingency", value: 10 },
  ]

  const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

  return (
    <main className="min-h-screen bg-background">
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">Kitchen Showroom + Coffee Shop Business Proposal</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">A combined experiential showroom and specialty coffee space designed to generate UGC, drive foot traffic, and convert high-intent prospects into premium cabinet sales while appealing to investors through diversified revenue.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact?topic=proposal">Discuss Investment</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/projects">View Related Projects</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <LazyImage src="https://res.cloudinary.com/dbviya1rj/image/upload/v1763825938/puet0csuee6rftjktc3f.png" alt="Showroom and coffee concept" width={700} height={500} className="rounded-xl border" priority />
            </motion.div>
          </div>
        </div>
      </section>

      

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Executive Summary</CardTitle>
              <CardDescription>Unique value, market scale, and competitive edge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-muted-foreground">
                <div className="text-foreground font-medium">Value Proposition</div>
                <div>Experiential kitchen showroom paired with a specialty coffee bar that increases dwell time, drives UGC, and converts high-intent visitors into premium cabinet sales.</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">12-month revenue target</div>
                  <div className="text-2xl font-semibold text-foreground">₱4.2M–₱6.0M</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Footfall to consult rate</div>
                  <div className="text-2xl font-semibold text-foreground">6%–10%</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Consult to sale rate</div>
                  <div className="text-2xl font-semibold text-foreground">25%–35%</div>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>Market opportunity: lifestyle retail and home improvement demand in PH with growing cafe culture</li>
                <li>Competitive advantage: integrated showroom hospitality, UGC flywheel, premium brand positioning, data-backed operations</li>
                <li>Capital: ₱700,000–₱1,300,000 with staged deployment and clear ROI plan</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Business Description</CardTitle>
              <CardDescription>Dual-model concept and target segments</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Dual business model leveraging kitchen showroom sales and coffee shop revenues</li>
                <li>Market gap: Few integrated showroom–cafe environments for luxury kitchens in the Philippines</li>
                <li>Target market: Upper-middle-class homeowners, interior designers, millennials, and coffee enthusiasts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Market Analysis</CardTitle>
              <CardDescription>Demand, competition, and customer behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Local demand for luxury kitchen products aligned with growing cafe culture</li>
                <li>Competitors: standalone kitchen stores and coffee shops; integrated experiential spaces are limited</li>
                <li>Customers: digital and social media savvy, seeking lifestyle-driven experiences</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-0">
        <div className="container mx-auto px-0">
          <figure className="relative group">
            <motion.video
              ref={videoRef}
              src="https://res.cloudinary.com/dbviya1rj/video/upload/v1763825834/kt7n7rwc4vods8hsnbxw.mp4"
              controls
              playsInline
              preload="metadata"
              aria-label="Coffee shop with kitchen showroom concept video"
              className="w-full h-auto max-h-[90vh] bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              muted={isMuted}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
              <span className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">UGC</span>
              <span className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">Experience</span>
              <span className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">Conversion</span>
            </div>
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              <button
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="pointer-events-auto inline-flex items-center justify-center rounded-md border bg-background/80 px-3 py-2 text-foreground backdrop-blur transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  const el = videoRef.current
                  if (!el) return
                  if (el.paused) {
                    el.play()
                  } else {
                    el.pause()
                  }
                }}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="pointer-events-auto inline-flex items-center justify-center rounded-md border bg-background/80 px-3 py-2 text-foreground backdrop-blur transition-all duration-200 hover:shadow-md"
                onClick={() => setIsMuted((v) => !v)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-t from-background/90 to-transparent text-foreground">
              <motion.div className="max-w-5xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
                <h2 className="text-2xl md:text-3xl font-bold">Coffee Shop + Kitchen Showroom</h2>
                <p className="mt-2 text-muted-foreground">A lifestyle-driven retail model that increases dwell time, sparks UGC, and converts high-intent visitors into premium cabinet sales.</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="rounded-md border bg-background/70 px-3 py-2 backdrop-blur">Dwell time uplift with hospitality-led experience</div>
                  <div className="rounded-md border bg-background/70 px-3 py-2 backdrop-blur">UGC flywheel amplifying reach and trust</div>
                  <div className="rounded-md border bg-background/70 px-3 py-2 backdrop-blur">Higher consult and conversion rates</div>
                  <div className="rounded-md border bg-background/70 px-3 py-2 backdrop-blur">Scalable blueprint for multi-location growth</div>
                </div>
              </motion.div>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Business Concept</CardTitle>
              <CardDescription>Experience-driven retail that blends product discovery with lifestyle hospitality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>Premium kitchen showroom with live-use stations and styled vignettes</li>
                <li>In-house specialty coffee bar encouraging dwell time and UGC</li>
                <li>Content-first environment for social sharing and influencer collabs</li>
                <li>Consultation area for design, quotations, and conversions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Business Plan Essentials</CardTitle>
              <CardDescription>Structure for operations, marketing, and monetization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>Location: high-traffic lifestyle district with affluent demographics</li>
                <li>Audience: homeowners, architects, interior designers, investors</li>
                <li>Revenue: cabinet sales, coffee sales, events, partnerships</li>
                <li>Marketing: UGC campaigns, referral programs, showroom tours</li>
                <li>KPIs: footfall, consultation bookings, conversion rate, CAC/LTV</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Financial Projections</CardTitle>
              <CardDescription>Assumptions and 12-month revenue trajectory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="text-foreground font-medium">Key assumptions</div>
                  <ul className="space-y-1">
                    <li>Average daily coffee sales ₱3,500–₱5,000; gross margin ~65%</li>
                    <li>Monthly cabinet conversions: 2–4 projects; average ticket ₱120k–₱180k</li>
                    <li>Marketing spend 8%–12% of revenue focused on UGC and referrals</li>
                    <li>Seasonality uplift Q4 driven by renovation cycles</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="m" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `₱${Math.round(v/1000)}k`} />
                      <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="coffee" stroke="#0ea5e9" strokeWidth={2} name="Coffee" />
                      <Line type="monotone" dataKey="cabinets" stroke="#10b981" strokeWidth={2} name="Cabinets" />
                      <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Operation Plan</CardTitle>
              <CardDescription>Space, layout, supply chain, and staffing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Location and space: 40–60 sqm commercial site</li>
                <li>Layout: kitchen display areas, coffee bar, seating for 20–30 customers</li>
                <li>Suppliers: kitchen displays and coffee beans from vetted partners</li>
                <li>Staffing: 1–2 baristas and 1 showroom attendant</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Capital Requirements</CardTitle>
              <CardDescription>Forecast for build-out, operations, and launch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Fit-out and fixtures</div>
                  <div>Showroom cabinetry, lighting, signage, seating</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Coffee equipment</div>
                  <div>Espresso setup, grinders, refrigeration, POS</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Initial inventory</div>
                  <div>Beans, consumables, collateral, merchandising</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Team and training</div>
                  <div>Baristas, showroom staff, SOPs, service playbooks</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Launch marketing</div>
                  <div>UGC incentives, opening event, paid social</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-foreground mb-1">Contingency</div>
                  <div>Risk buffer for 3–6 months</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Pre-Startup Steps</CardTitle>
              <CardDescription>Milestones before opening</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ol className="list-decimal list-inside space-y-2">
                <li>Finalize location and lease terms</li>
                <li>Complete design, MEP, and compliance</li>
                <li>Procure cabinetry and equipment</li>
                <li>Hire and train staff</li>
                <li>Set up analytics and CRM</li>
                <li>Run soft-opening and optimize</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Investor Appeal</CardTitle>
                <CardDescription>Compelling value with defensible differentiation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Diversified revenue with strong upsell into high-ticket sales</li>
                  <li>UGC-driven growth flywheel and organic reach</li>
                  <li>Premium brand positioning with experiential retail</li>
                  <li>Data-backed operations and clear performance metrics</li>
                  <li>Scalable blueprint for additional locations</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Market Size</CardTitle>
                <CardDescription>TAM, SAM, SOM overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={marketData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {marketData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between"><span>TAM</span><span className="text-foreground font-medium">₱35,000,000,000</span></div>
                    <div className="flex items-center justify-between"><span>SAM</span><span className="text-foreground font-medium">₱3,500,000,000</span></div>
                    <div className="flex items-center justify-between"><span>SOM (Year 1 goal)</span><span className="text-foreground font-medium">₱35,000,000</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Marketing Strategy</CardTitle>
              <CardDescription>UGC, collaborations, online presence, promotions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Launch campaigns focused on UGC with hashtags and photo spots</li>
                <li>Collaborations with local influencers and interior design communities</li>
                <li>Online presence across social media, website, and booking system</li>
                <li>Promotional offers for coffee and showroom visits</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Financial Plan</CardTitle>
              <CardDescription>Startup costs, revenues, expenses, projections, and ROI</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Startup costs covering rent, renovation, equipment, and initial inventory</li>
                <li>Revenue streams from kitchen product sales and coffee sales</li>
                <li>Projected expenses including salaries, supplies, marketing, and operations</li>
                <li>Financial projections for at least 12 months with break-even analysis</li>
                <li>ROI estimates for investors with milestone-based targets</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Investment Opportunity</CardTitle>
              <CardDescription>Funding, allocation, ROI scenarios, and exits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="text-foreground font-medium">Funding requirement</div>
                  <div>₱1,000,000 with staged deployment</div>
                  <div className="text-foreground font-medium">Use of funds</div>
                  <ul className="space-y-1">
                    <li>Fit-out and fixtures</li>
                    <li>Coffee equipment</li>
                    <li>Initial inventory</li>
                    <li>Staffing and training</li>
                    <li>Launch marketing</li>
                    <li>Contingency</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={allocationData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, ""]} />
                      <Legend />
                      <Bar dataKey="value" name="Allocation %">
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="text-foreground font-medium">ROI projections</div>
                  <ul className="space-y-1">
                    <li>Conservative: payback 18–24 months; IRR 18%–24%</li>
                    <li>Base case: payback 12–18 months; IRR 25%–32%</li>
                    <li>Optimistic: payback 9–12 months; IRR 33%–40%</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="text-foreground font-medium">Exit strategies</div>
                  <ul className="space-y-1">
                    <li>Buy-back at agreed multiple</li>
                    <li>Dividend distribution with step-down profit share</li>
                    <li>Expansion roll-up with equity conversion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-accent/5">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Team</CardTitle>
              <CardDescription>Experience and execution capability</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Founder & CEO</div>
                <div className="text-sm text-muted-foreground">10+ years in premium cabinetry and retail build-outs. Led multi-location deployments and supplier partnerships.</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Head of Design</div>
                <div className="text-sm text-muted-foreground">Interior design lead with luxury kitchen portfolio and ergonomic layouts optimized for conversion.</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Operations Lead</div>
                <div className="text-sm text-muted-foreground">F&B operations specialist with barista training programs and SOPs for consistent service quality.</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Advisory</CardTitle>
              <CardDescription>Specialists guiding strategy and growth</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Retail Strategist</div>
                <div className="text-sm text-muted-foreground">Store experience and merchandising for dwell-time and conversion.</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Coffee Consultant</div>
                <div className="text-sm text-muted-foreground">Menu engineering, sourcing, and bar workflow optimization.</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-semibold text-foreground">Financial Analyst</div>
                <div className="text-sm text-muted-foreground">Unit economics, scenario modeling, and KPI dashboards.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to collaborate?</h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">Schedule a discussion to review the model, market sizing, and detailed projections. Pitch deck and financial models available upon request.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact?topic=proposal">Book a Call</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href="mailto:info@modulux.design">Email: info@modulux.design</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Architectural Hardware Retail (China)</CardTitle>
              <CardDescription>Imported products strategy for the Chinese market</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Enter China’s fast-evolving architectural hardware market with premium imported products positioned for quality, compliance, and reliable distribution. Focus on demand-rich urban centers and digitally enabled channels for both B2B and B2C.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Market Analysis</CardTitle>
              <CardDescription>Demand, competition, and customer segments</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Demand driven by urbanization, renovation cycles, and premium residential/commercial builds</li>
                <li>Competitive landscape includes local manufacturers and global brands; opportunity in high-spec imported SKUs</li>
                <li>Target segments:
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-lg border p-3">
                      <div className="text-foreground font-medium">B2B</div>
                      <div className="text-sm">Contractors, developers, architects, design studios, facility managers</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-foreground font-medium">B2C</div>
                      <div className="text-sm">Homeowners and renovators purchasing premium hardware via e-commerce and retail</div>
                    </div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Distribution Strategy</CardTitle>
              <CardDescription>B2B channels, B2C approaches, and logistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>B2B: regional wholesalers, procurement partnerships, project-based supply to contractors and architectural firms</li>
                <li>B2C: flagship e-commerce storefronts (Tmall, JD), social commerce (Douyin), and selected retail showrooms</li>
                <li>Logistics: bonded warehouses or FTZ entry, HS code classification, customs brokerage, and last-mile delivery SLAs</li>
              </ul>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-foreground font-medium">Lead times</div>
                  <div>4–8 weeks ex-works depending on batch and routing</div>
                </div>
                <div>
                  <div className="text-foreground font-medium">Incoterms</div>
                  <div>FOB/CIF/DAP based on risk and control preferences</div>
                </div>
                <div>
                  <div className="text-foreground font-medium">Service levels</div>
                  <div>Order tracking, damage replacement, and installation guides</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Product Offering</CardTitle>
              <CardDescription>Portfolio, standards, and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-muted-foreground">
                <li>Products: hinges, slides, handles/pulls, door hardware, locks, soft-close mechanisms, drawer systems, architectural fasteners</li>
                <li>Quality and compliance: GB/GBT standards alignment, corrosion resistance ratings, cycle testing, material certifications</li>
                <li>Pricing: value tiers for B2B bulk and B2C retail with margin targets 18%–35% based on category and volume</li>
              </ul>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border p-4">
                  <div className="text-foreground font-medium">Certification examples</div>
                  <div className="text-sm text-muted-foreground">CCC where applicable, CNCA conformity, ISO 9001/14001 manufacturing quality</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-foreground font-medium">Packaging</div>
                  <div className="text-sm text-muted-foreground">Mandarin labeling, QR codes for specs, anti-counterfeit seals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Regulatory Compliance</CardTitle>
              <CardDescription>Imports, safety, and tax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-muted-foreground">
                <li>Imports: HS code classification, customs declarations, CIQ inspections when applicable, and documentation audit readiness</li>
                <li>Safety and quality: conformity assessments, test reports, and product registration standards; maintain traceability</li>
                <li>Tax and registration: VAT considerations commonly 13% for goods categories, local business licensing, and compliant invoicing</li>
              </ul>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Establish SOPs for compliance checks, batch-level documentation, and partner audits to reduce clearance risk and ensure customer trust.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}