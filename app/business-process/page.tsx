import fs from "fs/promises"
import path from "path"

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
      <section className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Business Process</h1>
          <p className="mt-3 text-lg text-muted-foreground">Complete workflow and SOPs</p>
          <div className="mt-8 rounded-2xl border p-6 bg-card">
            <div className="text-lg font-semibold text-foreground mb-3">Documentation</div>
            <div className="mt-2 space-y-4" dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
          </div>
        </div>
      </section>
    </main>
  )
}

