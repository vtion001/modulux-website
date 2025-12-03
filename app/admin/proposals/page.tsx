"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Trash2 } from "lucide-react"
import { estimateCabinetCost } from "@/lib/estimator"

type ProposalItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  details?: string
}

export default function AdminProposalsPage() {
  const searchParams = useSearchParams()
  const draftId = searchParams.get("id")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")

  const [title, setTitle] = useState("Kitchen Cabinet Proposal")
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState<string>("")
  const [notes, setNotes] = useState("")

  const [items, setItems] = useState<ProposalItem[]>([
    { id: crypto.randomUUID(), description: "Base cabinets (luxury)", quantity: 6, unitPrice: 18500, details: "" },
  ])
  const [taxRate, setTaxRate] = useState(12)
  const [discount, setDiscount] = useState(0)

  const [aiOpen, setAiOpen] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersionTs, setSelectedVersionTs] = useState<string>("")
  const [aiPreviewItems, setAiPreviewItems] = useState<ProposalItem[]>([])
  const [aiPreviewSubtotal, setAiPreviewSubtotal] = useState<number>(0)
  const [aiPreviewTaxRate, setAiPreviewTaxRate] = useState<number>(0)
  const [aiPreviewDiscount, setAiPreviewDiscount] = useState<number>(0)
  const [aiPreviewTitle, setAiPreviewTitle] = useState<string>("")
  const [aiPreviewNotes, setAiPreviewNotes] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      if (!draftId) return
      try {
        const res = await fetch("/data/proposals.json")
        const arr = await res.json().catch(() => [])
        if (Array.isArray(arr)) {
          const found = arr.find((p: any) => p.id === draftId)
          if (found) {
            setClientName(found?.client?.name || "")
            setClientEmail(found?.client?.email || "")
            setClientCompany(found?.client?.company || "")
            setTitle(found?.title || "Proposal")
            setItems((Array.isArray(found?.items) ? found.items : []).map((x: any) => ({ id: crypto.randomUUID(), description: String(x?.description || ""), quantity: Number(x?.quantity || 0), unitPrice: Number(x?.unitPrice || 0), details: String(x?.details || "") })))
            setTaxRate(Number(found?.taxRate || 0))
            setDiscount(Number(found?.discount || 0))
            setNotes(String(found?.notes || ""))
          }
        }
      } catch {}
    })()
  }, [draftId])

  useEffect(() => {
    if (!aiOpen) return
    ;(async () => {
      try {
        const res = await fetch("/api/pricing/versions", { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const arr = Array.isArray(json?.versions) ? json.versions : []
        setVersions(arr)
      } catch {}
    })()
  }, [aiOpen])

  const buildPreviewFromVersion = (ver: any) => {
    try {
      const data = ver?.data || {}
      const pre = data?.prefill || {}
      const form = pre?.formData || {}
      const unitsRaw = Array.isArray(pre?.units) ? pre.units : []
      const units = unitsRaw.map((u: any) => ({
        category: String(u.category || "base"),
        meters: Number(u.meters || 0),
        material: String(u.material || ""),
        finish: String(u.finish || ""),
        hardware: String(u.hardware || ""),
        tier: String(u.tier || pre?.tier || "luxury"),
      }))
      const legacyLm = typeof form.linearMeter === "string" ? parseFloat(form.linearMeter) : Number(form.linearMeter || 0)
      const useLegacy = Number.isFinite(legacyLm) && legacyLm > 0 && units.every((u:any)=>!(u.meters>0))
      const calc = estimateCabinetCost({
        projectType: String(form.projectType || "kitchen"),
        cabinetType: String(form.cabinetType || (pre?.tier === "standard" ? "basic" : (pre?.tier || "luxury"))),
        linearMeter: useLegacy ? legacyLm : undefined,
        installation: Boolean(form.installation || pre?.applyTax),
        cabinetCategory: String(pre?.cabinetCategory || "base"),
        tier: String(pre?.tier || "luxury"),
        baseRates: data?.baseRates || undefined,
        tierMultipliers: data?.tierMultipliers || undefined,
        sheetRates: data?.sheetRates || undefined,
        cabinetTypeMultipliers: data?.cabinetTypeMultipliers || undefined,
        units,
        discount: Number(pre?.discount || 0),
        applyTax: Boolean(pre?.applyTax || false),
        taxRate: Number(pre?.taxRate || 0),
        includeFees: Boolean(pre?.includeFees || false),
        applyImportSurcharge: Boolean(pre?.importSurcharge || false),
        downgradeToMFC: Boolean(pre?.downgradeMFC || false),
      })
      const metaList = units.filter((u:any)=>Number(u.meters)>0)
      const itemsMapped: ProposalItem[] = (calc?.breakdown?.units || []).map((u:any, idx:number) => {
        const meta = metaList[idx] || {}
        const materialTxt = String(meta.material||"").replace(/_/g," ")
        const finishTxt = String(meta.finish||"").replace(/_/g," ")
        const hardwareTxt = String(meta.hardware||"").replace(/_/g," ")
        const details = [
          `Tier: ${String(u.tier||pre?.tier||"luxury")}`,
          materialTxt ? `Material: ${materialTxt}` : null,
          finishTxt ? `Finish: ${finishTxt}` : null,
          hardwareTxt ? `Hardware: ${hardwareTxt}` : null,
          `Meters: ${Number(u.meters||0)}`,
          `Rate: ₱${Number(u.baseRate||0).toLocaleString()}/m`,
          `Factors: ×${Number(u.tierFactor||1)} ×${Number(u.materialFactor||1)} ×${Number(u.finishFactor||1)} ×${Number(u.hardwareFactor||1)}`,
          Number(u.installationAdd||0) ? `Install add: ₱${Number(u.installationAdd||0).toLocaleString()}` : null,
        ].filter(Boolean).join(" • ")
        return {
          id: crypto.randomUUID(),
          description: `${u.category} cabinets (${String(form.cabinetType || (pre?.tier === "standard" ? "basic" : (pre?.tier || "luxury")))})`,
          quantity: Number(u.meters||0),
          unitPrice: Math.round(Number(u.lineTotal||0)/Math.max(1, Number(u.meters||1))),
          details,
        }
      })
      const subtotalCalc = Number(calc?.breakdown?.subtotal || 0)
      const taxPct = pre?.applyTax ? Math.round(Number(pre?.taxRate || 0) * 100) : 0
      const discountAbs = Math.round(Number(pre?.discount || 0) * subtotalCalc)
      const titleFrom = String(form.projectType || "Project")
      setAiPreviewItems(itemsMapped)
      setAiPreviewSubtotal(subtotalCalc)
      setAiPreviewTaxRate(taxPct)
      setAiPreviewDiscount(discountAbs)
      setAiPreviewTitle(`${titleFrom} Proposal`)
      setAiPreviewNotes("Auto-filled from Pricing Version")
    } catch {}
  }

  const applyAiPrefill = () => {
    setItems(aiPreviewItems)
    setTaxRate(aiPreviewTaxRate)
    setDiscount(aiPreviewDiscount)
    setTitle(aiPreviewTitle || title)
    setNotes(aiPreviewNotes || notes)
    setAiOpen(false)
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, details: "" },
    ])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const updateItem = (id: string, patch: Partial<ProposalItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0)
  }, [items])

  const tax = useMemo(() => {
    return (subtotal * taxRate) / 100
  }, [subtotal, taxRate])

  const total = useMemo(() => {
    return Math.max(0, subtotal + tax - discount)
  }, [subtotal, tax, discount])

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Proposal Creator</h1>
                <p className="text-sm md:text-base/relaxed opacity-90">Compose proposals with a live document preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Save Draft</Button>
              <Button>Submit</Button>
              <Button variant="outline" onClick={() => setAiOpen(true)}>AI Fill</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground mb-3">Client Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="p-2 border border-border/40 rounded-md bg-background text-foreground"
                placeholder="Client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                className="p-2 border border-border/40 rounded-md bg-background text-foreground"
                placeholder="Client email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <input
                className="p-2 border border-border/40 rounded-md bg-background text-foreground md:col-span-2"
                placeholder="Company (optional)"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground mb-3">Proposal Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="p-2 border border-border/40 rounded-md bg-background text-foreground md:col-span-2"
                placeholder="Proposal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Issue date</label>
                <input
                  type="date"
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Valid until</label>
                <input
                  type="date"
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Notes</label>
                <textarea
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  rows={3}
                  placeholder="Scope, materials, timelines, and terms"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-foreground">Line Items</div>
              <Button variant="outline" size="sm" onClick={addItem} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <input
                    className="col-span-4 p-2 border border-border/40 rounded-md bg-background text-foreground"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  />
                  <input
                    className="col-span-2 p-2 border border-border/40 rounded-md bg-background text-foreground"
                    placeholder="Details"
                    value={item.details || ""}
                    onChange={(e) => updateItem(item.id, { details: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    className="col-span-2 p-2 border border-border/40 rounded-md bg-background text-foreground"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    min={0}
                    className="col-span-3 p-2 border border-border/40 rounded-md bg-background text-foreground"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                  />
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeItem(item.id)}
                    className="col-span-1 inline-flex items-center justify-center rounded-md border border-border/40 bg-background text-foreground hover:bg-muted/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground mb-3">Totals</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tax rate %</label>
                <input
                  type="number"
                  min={0}
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Discount</label>
                <input
                  type="number"
                  min={0}
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Subtotal</label>
                <div className="p-2 border border-border/40 rounded-md bg-muted/30 text-foreground">
                  ₱{subtotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="font-semibold">Preview</div>
              <div className="text-sm text-muted-foreground">Just now</div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">

                  <img
                    src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
                    alt="ModuLux Logo"
                    className="w-60 h-20 rounded-md border border-border/40 object-cover"
                  />
                  <div>
                    <div className="text-2xl font-bold text-foreground">{title || "Untitled Proposal"}</div>
                    <div className="text-sm text-muted-foreground">Issue date: {issueDate || "—"}</div>
                    <div className="text-sm text-muted-foreground">Valid until: {validUntil || "—"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">ModuLux</div>
                  <div className="text-sm text-muted-foreground">sales@modulux.ph</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Client</div>
                  <div className="text-sm font-medium text-foreground">{clientName || "—"}</div>
                  <div className="text-sm text-muted-foreground">{clientEmail || ""}</div>
                  <div className="text-sm text-muted-foreground">{clientCompany || ""}</div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Summary</div>
                  <div className="text-sm text-muted-foreground">{notes || "No notes provided."}</div>
                </div>
              </div>

              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-medium pb-2">Item</th>
                      <th className="text-right font-medium pb-2">Qty</th>
                      <th className="text-right font-medium pb-2">Unit</th>
                      <th className="text-right font-medium pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((x) => (
                      <tr key={x.id} className="border-t border-border/40">
                        <td className="py-2">{x.description || "—"}</td>
                        <td className="text-right py-2">{x.quantity}</td>
                        <td className="text-right py-2">₱{x.unitPrice.toLocaleString()}</td>
                        <td className="text-right py-2">₱{(x.quantity * x.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/40">
                      <td colSpan={3} className="text-right py-2">Subtotal</td>
                      <td className="text-right py-2">₱{subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2">Tax ({taxRate}%)</td>
                      <td className="text-right py-2">₱{tax.toLocaleString()}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right py-2">Discount</td>
                        <td className="text-right py-2">-₱{discount.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t border-border/40">
                      <td colSpan={3} className="text-right py-2 font-semibold">Total</td>
                      <td className="text-right py-2 font-semibold">₱{total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-xs text-muted-foreground">This is a proposal document generated for review purposes. Final scope and pricing may vary based on site survey and material selection.</div>
            </div>
          </div>
        </div>
      </div>
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-card rounded-lg shadow-lg border border-border/40 p-6">
            <div className="text-lg font-semibold text-foreground mb-4">AI Fill from Pricing Versions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <select
                value={selectedVersionTs}
                onChange={(e)=>{ setSelectedVersionTs(e.target.value); const ver = versions.find((v:any)=>String(v.ts)===e.target.value); if (ver) buildPreviewFromVersion(ver) }}
                className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground"
              >
                <option value="">Select a version</option>
                {versions.map((v:any)=>(
                  <option key={v.ts} value={String(v.ts)}>{new Date(v.ts).toLocaleString()}</option>
                ))}
              </select>
              <div className="p-2 border rounded-md text-sm">
                <div className="font-medium">Preview</div>
                <div className="mt-2">Items: {aiPreviewItems.length}</div>
                <div>Subtotal: ₱{aiPreviewSubtotal.toLocaleString()}</div>
                <div>Tax: {aiPreviewTaxRate}%</div>
                <div>Discount: ₱{aiPreviewDiscount.toLocaleString()}</div>
              </div>
            </div>
            {aiPreviewItems.length > 0 && (
              <div className="max-h-56 overflow-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiPreviewItems.map((x)=> (
                      <tr key={x.id} className="border-t">
                        <td className="p-2">{x.description}</td>
                        <td className="p-2 text-right">{x.quantity}</td>
                        <td className="p-2 text-right">₱{x.unitPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setAiOpen(false)}>Cancel</Button>
              <Button onClick={()=>applyAiPrefill()} disabled={!selectedVersionTs}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
