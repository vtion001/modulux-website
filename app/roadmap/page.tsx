import fs from "fs/promises"
import path from "path"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Users, Ruler, Package, Wrench, CheckCircle, Shield, TrendingUp, Sparkles, ClipboardList, Hammer, Settings } from "lucide-react"

function Stat({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl border border-border/40 bg-card/60">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm">
      <div className="text-lg font-semibold text-foreground mb-3">{title}</div>
      <div className="space-y-2 text-sm text-foreground/90">{children}</div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function mdToHtml(md: string) {
  const lines = md.split(/\r?\n/)
  let html = ""
  let inUl = false
  let inOl = false
  let inTable = false
  let tableHeaderDone = false

  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false }
    if (inOl) { html += "</ol>"; inOl = false }
  }
  const closeTable = () => {
    if (inTable) { html += "</tbody></table>"; inTable = false; tableHeaderDone = false }
  }

  const strong = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

  for (let raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { continue }

    if (/^---+$/.test(line)) {
      closeLists(); closeTable()
      html += '<hr class="my-6 border-border/40" />'
      continue
    }

    if (line.startsWith("### ")) {
      closeLists(); closeTable()
      const t = line.replace(/^###\s+/, "")
      html += `<h3 class="mt-8 text-xl font-semibold text-foreground border-l-2 pl-3 border-primary/60">${strong(escapeHtml(t))}</h3>`
      continue
    }
    if (line.startsWith("#### ")) {
      closeLists(); closeTable()
      const t = line.replace(/^####\s+/, "")
      html += `<h4 class="mt-6 text-lg font-semibold text-foreground">${strong(escapeHtml(t))}</h4>`
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); html += '<ol class="ml-5 space-y-1 list-decimal">'; inOl = true }
      const t = line.replace(/^\d+\.\s+/, "")
      html += `<li>${strong(escapeHtml(t))}</li>`
      continue
    }
    if (line.startsWith("- ")) {
      if (!inUl) { closeLists(); html += '<ul class="ml-5 space-y-1 list-disc">'; inUl = true }
      const t = line.replace(/^\-\s+/, "")
      html += `<li>${strong(escapeHtml(t))}</li>`
      continue
    }

    if (line.startsWith("|") || /\|\s*Step\s*\|/.test(line)) {
      if (!inTable) {
        closeLists(); html += '<table class="min-w-full text-sm border rounded overflow-hidden"><thead class="bg-muted/30">'; inTable = true; tableHeaderDone = false
      }
      const cells = line.split("|").slice(1, -1).map(c => c.trim())
      if (!tableHeaderDone) {
        html += '<tr>' + cells.map(c => `<th class="text-left p-2">${escapeHtml(c)}</th>`).join("") + '</tr></thead><tbody>'
        tableHeaderDone = true
      } else if (!/^[-\s]+$/.test(line.replace(/\|/g, ""))) {
        html += '<tr class="border-t">' + cells.map(c => `<td class="p-2">${escapeHtml(c)}</td>`).join("") + '</tr>'
      }
      continue
    } else {
      closeTable()
    }

    closeLists()
    html += `<p class="leading-7 text-foreground/90">${strong(escapeHtml(line))}</p>`
  }

  closeLists(); closeTable()
  return html
}

export default async function RoadmapPage() {
  const filePath = path.join(process.cwd(), "Business Process")
  let content = ""
  try {
    content = await fs.readFile(filePath, "utf-8")
  } catch {}

  const steps = [
    { icon: Users, title: "Customer Acquisition", desc: "Lead capture and qualification in CRM" },
    { icon: Ruler, title: "Design & Quotation", desc: "Concept to detailed 3D and itemized pricing" },
    { icon: Package, title: "Procurement", desc: "Local sourcing or import logistics" },
    { icon: Wrench, title: "Installation", desc: "Certified installers, site-ready delivery" },
    { icon: CheckCircle, title: "After-Sales", desc: "Warranty handling and support" },
  ]

  const tools = [
    { icon: ClipboardList, title: "CRM", desc: "Modulux CRM for leads and quotes" },
    { icon: Settings, title: "Project Mgmt", desc: "Modulux Project Management for task orchestration" },
    { icon: FileText, title: "Accounting", desc: "Xero/QuickBooks invoicing" },
    { icon: Sparkles, title: "Design", desc: "Mozaik Software/Sketch Up for 3D" },
    { icon: Shield, title: "Compliance", desc: "Contracts, BLs, warranties" },
  ]

  const risks = [
    { title: "Supplier Diversification", desc: "Multiple vetted fabricators and importer backup" },
    { title: "Currency Hedging", desc: "Forward contracts for PHP payments" },
    { title: "Insurance", desc: "Cargo and installation liability coverage" },
    { title: "Contingency Fund", desc: "10% buffer for delays or damages" },
  ]

  const scale = [
    { title: "Year 1", desc: "Focus local projects, build supplier network" },
    { title: "Year 2", desc: "Expand imports, negotiate bulk discounts" },
    { title: "Long-Term", desc: "Partial in-house assembly to reduce costs" },
  ]

  const workflow = [
    { step: "Initial Consultation", output: "Rough estimate", timeline: "30 mins" },
    { step: "Downpayment Collection", output: "25% design downpayment", timeline: "≤48 hrs" },
    { step: "Conceptualization", output: "Mood boards / basic layout", timeline: "3–5 days" },
    { step: "Concept Approval", output: "Approved concept", timeline: "1–2 days" },
    { step: "Detailed 3D Design", output: "Final render + itemized quote", timeline: "5–7 days" },
    { step: "Final Quotation & Contract", output: "Signed contract + invoice", timeline: "1 day" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Business Process Roadmap</h1>
              <p className="mt-3 text-lg text-muted-foreground">A clear, premium-grade workflow from lead to installation and beyond</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/proposal">Business Proposal</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pitch-deck">Pitch Deck</Link>
              </Button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-3">
            {steps.map((s) => (
              <Stat key={s.title} icon={s.icon} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Phase 1: Customer Engagement & Design">
            <ul className="space-y-2">
              <li>Showroom or inquiry intake with needs assessment</li>
              <li>3D design and itemized quotation with lead time</li>
            </ul>
          </Card>
          <Card title="Phase 2: Procurement">
            <ul className="space-y-2">
              <li>Local sourcing for small/medium projects with QC</li>
              <li>Import workflow: samples, Incoterms, freight, customs</li>
            </ul>
          </Card>
          <Card title="Phase 3–4: Installation & After-Sales">
            <ul className="space-y-2">
              <li>Certified installers follow blueprint and site survey</li>
              <li>Warranty handling via logged inspection and repair</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Key SOPs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-1">Supplier Management</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Vetting, contracts, payment terms</li>
                  <li>Lead time and penalties for delays</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Quality Control</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Pre-shipment inspection</li>
                  <li>Receiving checklist on warehouse intake</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Inventory & Logistics</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Warehouse near showroom</li>
                  <li>Scheduled delivery with tracking</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Documentation & Comms</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Quotes, POs, BLs, invoices, warranties</li>
                  <li>Weekly client updates and escalation</li>
                </ul>
              </div>
            </div>
          </Card>
          <Card title="Tools & Technology">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tools.map(t => (
                <div key={t.title} className="flex items-center gap-3 p-3 rounded-lg border">
                  <t.icon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {risks.map(r => (
            <div key={r.title} className="rounded-2xl border p-6 bg-card/70">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <div className="text-sm font-semibold text-foreground">{r.title}</div>
              </div>
              <div className="text-sm text-muted-foreground">{r.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border p-6 bg-card/80">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div className="text-lg font-semibold text-foreground">Scalability Plan</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scale.map(s => (
              <div key={s.title} className="p-4 rounded-lg border">
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6 bg-card/80">
          <div className="text-lg font-semibold text-foreground mb-3">Revised Design Workflow</div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-2">Step</th>
                  <th className="text-left p-2">Key Outputs</th>
                  <th className="text-left p-2">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {workflow.map((w, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{w.step}</td>
                    <td className="p-2">{w.output}</td>
                    <td className="p-2">{w.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border p-6 bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold text-foreground">Detailed Documentation</div>
            <div className="text-xs text-muted-foreground">Sourced from the Business Process document</div>
          </div>
          <div className="mt-2 space-y-4" dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
        </div>
      </section>
    </main>
  )
}
