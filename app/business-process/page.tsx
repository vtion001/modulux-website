import fs from "fs/promises"
import path from "path"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LazyImage } from "@/components/lazy-image"

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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

    if (/^---+$/.test(line)) { closeLists(); closeTable(); html += '<hr class="my-6 border-border/40" />'; continue }
    if (line.startsWith("### ")) { closeLists(); closeTable(); const t = line.replace(/^###\s+/, ""); html += `<h3 class="mt-8 text-xl font-semibold text-foreground border-l-2 pl-3 border-primary/60">${strong(escapeHtml(t))}</h3>`; continue }
    if (line.startsWith("#### ")) { closeLists(); closeTable(); const t = line.replace(/^####\s+/, ""); html += `<h4 class="mt-6 text-lg font-semibold text-foreground">${strong(escapeHtml(t))}</h4>`; continue }

    if (/^\d+\.\s+/.test(line)) { if (!inOl) { closeLists(); html += '<ol class="ml-5 space-y-1 list-decimal">'; inOl = true } const t = line.replace(/^\d+\.\s+/, ""); html += `<li>${strong(escapeHtml(t))}</li>`; continue }
    if (line.startsWith("- ")) { if (!inUl) { closeLists(); html += '<ul class="ml-5 space-y-1 list-disc">'; inUl = true } const t = line.replace(/^\-\s+/, ""); html += `<li>${strong(escapeHtml(t))}</li>`; continue }

    if (line.startsWith("|") || /\|\s*Step\s*\|/.test(line)) {
      if (!inTable) { closeLists(); html += '<table class="min-w-full text-sm border rounded overflow-hidden"><thead class="bg-muted/30">'; inTable = true; tableHeaderDone = false }
      const cells = line.split("|").slice(1, -1).map(c => c.trim())
      if (!tableHeaderDone) { html += '<tr>' + cells.map(c => `<th class="text-left p-2">${escapeHtml(c)}</th>`).join("") + '</tr></thead><tbody>'; tableHeaderDone = true }
      else if (!/^[-\s]+$/.test(line.replace(/\|/g, ""))) { html += '<tr class="border-t">' + cells.map(c => `<td class="p-2">${escapeHtml(c)}</td>`).join("") + '</tr>' }
      continue
    } else { closeTable() }

    closeLists(); html += `<p class="leading-7 text-foreground/90">${strong(escapeHtml(line))}</p>`
  }

  closeLists(); closeTable()
  return html
}

export default async function BusinessProcessPage() {
  const filePath = path.join(process.cwd(), "docs", "Business Process.md")
  let content = ""
  try { content = await fs.readFile(filePath, "utf-8") } catch {}
  return (
    <main className="min-h-screen bg-background">
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Business Process</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">A premium-grade workflow from lead to installation and beyond, aligned to operations and SOPs.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact?topic=business-process">Discuss Operations</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/proposal">View Proposal</Link>
                </Button>
              </div>
            </div>
            <div>
              <LazyImage src="/modern-kitchen-cabinet-installation.jpg" alt="Business process visual" width={700} height={500} className="rounded-xl border" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Core Workflow</CardTitle>
              <CardDescription>Inquiry to design commitment, procurement, install, after-sales</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Customer engagement with CRM capture and 25% design down-payment</li>
                <li>Concept to detailed 3D design and itemized quotation</li>
                <li>Local sourcing or import logistics with QC and documentation</li>
                <li>Installation by certified teams and warranty-backed support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Operations Snapshot</CardTitle>
              <CardDescription>SOPs, tooling, and risk controls</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Supplier vetting, contracts, and inspection procedures</li>
                <li>Warehouse logistics, delivery scheduling, and QC intake</li>
                <li>Documentation governance across quotes, POs, BLs, invoices</li>
                <li>Weekly client updates and escalation pathways</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Detailed Documentation</CardTitle>
              <CardDescription>Sourced from the Business Process document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4" dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
