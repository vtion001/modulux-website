"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Trash2 } from "lucide-react"

type ProposalItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
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
    { id: crypto.randomUUID(), description: "Base cabinets (luxury)", quantity: 6, unitPrice: 18500 },
  ])
  const [taxRate, setTaxRate] = useState(12)
  const [discount, setDiscount] = useState(0)

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
            setItems((Array.isArray(found?.items) ? found.items : []).map((x: any) => ({ id: crypto.randomUUID(), description: String(x?.description || ""), quantity: Number(x?.quantity || 0), unitPrice: Number(x?.unitPrice || 0) })))
            setTaxRate(Number(found?.taxRate || 0))
            setDiscount(Number(found?.discount || 0))
            setNotes(String(found?.notes || ""))
          }
        }
      } catch {}
    })()
  }, [draftId])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
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
                    className="col-span-6 p-2 border border-border/40 rounded-md bg-background text-foreground"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
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
                <div>
                  <div className="text-2xl font-bold text-foreground">{title || "Untitled Proposal"}</div>
                  <div className="text-sm text-muted-foreground">Issue date: {issueDate || "—"}</div>
                  <div className="text-sm text-muted-foreground">Valid until: {validUntil || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">ModuLux Company, Inc.</div>
                  <div className="text-sm text-muted-foreground">hello@modulux.ph</div>
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
    </div>
  )
}
