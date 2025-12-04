"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Trash2 } from "lucide-react"
import { estimateCabinetCost } from "@/lib/estimator"
import { toast } from "sonner"
const tierSpecs: Record<string, { items: string[]; exclusive: string[] }> = {
  standard: {
    items: [
      "Carcass: 18mm MR MFC Melamine Board",
      "Door: 18mm MR MFC Melamine Board",
      "Hinges: Zinc Plated 3D Hinges Soft Closing",
      "Drawers: Regular Wooden Drawing Box ( Soft Closing )",
      "Countertop: Granite Countertop",
    ],
    exclusive: ["Special Mechanism", "Lighting", "Appliances"],
  },
  premium: {
    items: [
      "Carcass: 18mm Melamine Marine Plywood",
      "Door: 18mm MDF PETG/UV Ray Gloss / Synchronized Boards",
      "Hinges: Hettich Hinges ( Soft Closing )",
      "Drawers: Hettich Tandem Box Drawers ( Soft Closing )",
      "Countertop: Synthetic Quartz Countertop",
    ],
    exclusive: ["Special Mechanism", "Lighting", "Appliances"],
  },
  luxury: {
    items: [
      "Carcass: 18mm Celuka PVC Boards",
      "Door: 18mm MDF PETG/Acrylic Boards",
      "Hinges: Blum Hinges ( Soft Closing )",
      "Drawers: Blum Tandem Box Drawers ( Soft Closing )",
      "Countertop: Synthetic Quartz Countertop",
    ],
    exclusive: ["Special Mechanism", "Lighting", "Appliances"],
  },
}

type ProposalItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  details?: string
}

export default function AdminProposalsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const draftId = searchParams.get("id")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [crmSelectedId, setCrmSelectedId] = useState<string>("")

  const [crmQuery, setCrmQuery] = useState("")
  const [crmQueryDebounced, setCrmQueryDebounced] = useState("")
  const [crmResults, setCrmResults] = useState<any[]>([])
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  const crmAllRef = useRef<any[] | null>(null)
  const crmRef = useRef<HTMLDivElement | null>(null)
  const [createdDealId, setCreatedDealId] = useState<string>("")
  const [createdLeadId, setCreatedLeadId] = useState<string>("")

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
  const [drafts, setDrafts] = useState<any[]>([])
  const [draftsLoading, setDraftsLoading] = useState<boolean>(false)
  const [draftQuery, setDraftQuery] = useState<string>("")
  const [debouncedDraftQuery, setDebouncedDraftQuery] = useState<string>("")
  const [sortKey, setSortKey] = useState<string>("updated_desc")
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [draftTotal, setDraftTotal] = useState<number>(0)
  const totalPages = Math.max(1, Math.ceil(draftTotal / Math.max(1, pageSize)))
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  useAdminDraftsShortcuts(searchInputRef, page, totalPages, (p:number)=>setPage(p))

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
            setClientPhone(found?.client?.phone || "")
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
    const h = setTimeout(() => setCrmQueryDebounced(crmQuery), 300)
    return () => clearTimeout(h)
  }, [crmQuery])

  useEffect(() => {
    const q = crmQueryDebounced.trim().toLowerCase()
    if (q.length < 2) {
      setCrmResults([])
      return
    }
    setCrmLoading(true)
    ;(async () => {
      try {
        if (!crmAllRef.current || crmAllRef.current.length === 0) {
          const res = await fetch("/api/crm/contacts", { cache: "no-store" })
          const json = await res.json().catch(() => ({}))
          const merged = ([] as any[]).concat(json?.contacts || [], json?.leads || [], json?.clients || [])
          crmAllRef.current = merged
        }
        const base = crmAllRef.current || []
        const results = base.filter((c: any) => {
          const name = String(c?.name || "").toLowerCase()
          const email = String(c?.email || "").toLowerCase()
          const company = String(c?.company || "").toLowerCase()
          return name.includes(q) || email.includes(q) || company.includes(q)
        }).slice(0, 10)
        setCrmResults(results)
        setCrmOpen(true)
      } finally {
        setCrmLoading(false)
      }
    })()
  }, [crmQueryDebounced])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = crmRef.current
      if (el && !el.contains(e.target as Node)) setCrmOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const selectCrm = (c: any) => {
    setClientName(String(c?.name || ""))
    setClientEmail(String(c?.email || ""))
    setClientCompany(String(c?.company || ""))
    setClientPhone(String(c?.phone || ""))
    setCrmSelectedId(String(c?.id || ""))
    setCrmQuery("")
    setCrmOpen(false)
  }

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
        installation: Boolean(form.installation || false),
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
      const tierStr = String(pre?.tier || "luxury")
      const spec = tierSpecs[tierStr] || { items: [], exclusive: [] }
      const specIncluded = spec.items.join(", ")
      const specExclusive = spec.exclusive.join(", ")
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
          specIncluded ? `Included: ${specIncluded}` : null,
          specExclusive ? `Exclusive: ${specExclusive}` : null,
        ].filter(Boolean).join("\n")
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

  const loadDrafts = async () => {
    try {
      setDraftsLoading(true)
      const params = new URLSearchParams()
      if (debouncedDraftQuery.trim()) params.set("q", debouncedDraftQuery.trim())
      params.set("sort", sortKey)
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))
      const res = await fetch(`/api/proposals/drafts?${params.toString()}`, { cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      const arr = Array.isArray(json?.drafts) ? json.drafts : []
      setDrafts(arr)
      setDraftTotal(Number(json?.total || arr.length))
    } finally {
      setDraftsLoading(false)
    }
  }
  useEffect(() => {
    loadDrafts()
  }, [debouncedDraftQuery, sortKey, page, pageSize])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedDraftQuery(draftQuery)
    }, 300)
    return () => clearTimeout(t)
  }, [draftQuery])

  useEffect(() => {
    const initialQ = searchParams.get("q")
    const initialSort = searchParams.get("sort")
    const initialPage = searchParams.get("page")
    const initialPageSize = searchParams.get("pageSize")
    if (initialQ != null) setDraftQuery(String(initialQ))
    if (initialSort) setSortKey(String(initialSort))
    if (initialPage) {
      const p = Math.max(1, Number(initialPage) || 1)
      setPage(p)
    }
    if (initialPageSize) {
      const ps = Math.max(1, Number(initialPageSize) || 10)
      setPageSize(ps)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (draftId) params.set("id", draftId)
    if (draftQuery.trim()) params.set("q", draftQuery.trim())
    params.set("sort", sortKey)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    router.replace(`/admin/proposals?${params.toString()}`)
  }, [draftQuery, sortKey, page, pageSize, draftId])

  const saveDraft = async () => {
    try {
      setSavingDraft(true)
      const payload = {
        client: { name: clientName, email: clientEmail, company: clientCompany, phone: clientPhone },
        crmId: crmSelectedId,
        title,
        items,
        taxRate,
        discount,
        notes,
      }
      const res = await fetch("/api/proposals/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.ok) {
        toast.success("Draft saved")
        await loadDrafts()
      } else {
        toast.error(String(json?.error || "Failed to save draft"))
      }
    } catch {}
    finally {
      setSavingDraft(false)
    }
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

  const previewBreakdown = useMemo(() => {
    const caps = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const allowed = ["base", "hanging", "tall"]
    const roomGuess = caps(String(title || "Project").split(" ")[0].toLowerCase())
    return items.map((x) => {
      const desc = String(x.description || "")
      const first = desc.split(" ")[0].toLowerCase()
      const category = allowed.includes(first) ? first : ""
      const details = String(x.details || "")
      let tierMul = "×1"
      let materialMul = "×1"
      let finishMul = "×1"
      let hardwareMul = "×1"
      let installTxt = "₱0"
      const facMatch = details.match(/Factors:\s*×([0-9\.]+)\s*×([0-9\.]+)\s*×([0-9\.]+)\s*×([0-9\.]+)/)
      if (facMatch) {
        tierMul = `×${facMatch[1]}`
        materialMul = `×${facMatch[2]}`
        finishMul = `×${facMatch[3]}`
        hardwareMul = `×${facMatch[4]}`
      }
      const instMatch = details.match(/Install add:\s*₱([0-9,\.]+)/)
      if (instMatch) installTxt = `₱${instMatch[1]}`
      const meters = Number(x.quantity || 0)
      const rate = Number(x.unitPrice || 0)
      const totalLine = Math.round(meters * rate)
      return { category, set: 1, room: roomGuess, meters, rate, details, installTxt, totalLine, id: x.id }
    })
  }, [items, title])

  const aiPreviewBreakdown = useMemo(() => {
    const caps = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const allowed = ["base", "hanging", "tall"]
    const roomGuess = caps(String(aiPreviewTitle || title || "Project").split(" ")[0].toLowerCase())
    return aiPreviewItems.map((x) => {
      const desc = String(x.description || "")
      const first = desc.split(" ")[0].toLowerCase()
      const category = allowed.includes(first) ? first : ""
      const details = String(x.details || "")
      let tierMul = "×1"
      let materialMul = "×1"
      let finishMul = "×1"
      let hardwareMul = "×1"
      let installTxt = "₱0"
      const facMatch = details.match(/Factors:\s*×([0-9\.]+)\s*×([0-9\.]+)\s*×([0-9\.]+)\s*×([0-9\.]+)/)
      if (facMatch) {
        tierMul = `×${facMatch[1]}`
        materialMul = `×${facMatch[2]}`
        finishMul = `×${facMatch[3]}`
        hardwareMul = `×${facMatch[4]}`
      }
      const instMatch = details.match(/Install add:\s*₱([0-9,\.]+)/)
      if (instMatch) installTxt = `₱${instMatch[1]}`
      const meters = Number(x.quantity || 0)
      const rate = Number(x.unitPrice || 0)
      const totalLine = Math.round(meters * rate)
      return { category, set: 1, room: roomGuess, meters, rate, details, installTxt, totalLine, id: x.id }
    })
  }, [aiPreviewItems, aiPreviewTitle, title])

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
              <Button variant="outline" onClick={() => saveDraft()} disabled={savingDraft} aria-busy={savingDraft}>{savingDraft ? "Saving…" : "Save Draft"}</Button>
              <Button onClick={async () => {
                const payload = {
                  client: { name: clientName, email: clientEmail, company: clientCompany, phone: clientPhone },
                  crmId: crmSelectedId,
                  title,
                  items,
                  taxRate,
                  discount,
                  notes,
                }
                try {
                  setSubmitting(true)
                  const res = await fetch("/api/proposals/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                  const data = await res.json().catch(() => ({}))
                  if (res.ok && data?.id) {
                    toast.success("Proposal submitted")
                    window.location.href = `/admin/proposals?id=${encodeURIComponent(data.id)}`
                  } else {
                    toast.error(String(data?.error || "Submission failed"))
                  }
                } catch {}
                finally {
                  setSubmitting(false)
                }
              }} disabled={submitting} aria-busy={submitting}>{submitting ? "Submitting…" : "Submit"}</Button>
              <Button variant="outline" onClick={() => setAiOpen(true)}>AI Fill</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
        <div className="text-sm font-semibold text-foreground mb-3">Drafts</div>
        <div className="mb-3 flex items-center gap-2">
          <input
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search drafts by title, client, or email"
            className="p-2 border rounded-md bg-background text-foreground text-sm w-full md:w-72"
            ref={searchInputRef}
          />
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setPage(1) }}
            className="p-2 border rounded-md bg-background text-foreground text-sm"
          >
            <option value="updated_desc">Newest</option>
            <option value="updated_asc">Oldest</option>
            <option value="title_asc">Title</option>
            <option value="client_asc">Client</option>
          </select>
          <select
            value={String(pageSize)}
            onChange={(e) => { const v = Number(e.target.value)||10; setPageSize(v); setPage(1) }}
            className="p-2 border rounded-md bg-background text-foreground text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <div className="text-xs text-muted-foreground mb-2">Press / to focus search, ←/→ to paginate</div>
        {draftsLoading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-2">
            {drafts.length === 0 ? (
              <div className="text-xs text-muted-foreground">No drafts found.</div>
            ) : (
              drafts.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-3 border rounded p-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(d.title || "Untitled Proposal")}</div>
                    <div className="text-muted-foreground truncate">{String(d?.client?.name || "")} • {new Date(d.updated_at || d.created_at || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setClientName(String(d?.client?.name || ""))
                      setClientEmail(String(d?.client?.email || ""))
                      setClientCompany(String(d?.client?.company || ""))
                      setClientPhone(String(d?.client?.phone || ""))
                      setCrmSelectedId(String(d?.crmId || ""))
                      setTitle(String(d?.title || "Proposal"))
                      setItems((Array.isArray(d?.items) ? d.items : []).map((x: any) => ({ id: crypto.randomUUID(), description: String(x?.description || ""), quantity: Number(x?.quantity || 0), unitPrice: Number(x?.unitPrice || 0), details: String(x?.details || "") })))
                      setTaxRate(Number(d?.taxRate || 0))
                      setDiscount(Number(d?.discount || 0))
                      setNotes(String(d?.notes || ""))
                    }}>Load</Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      const name = window.prompt("Rename draft", String(d?.title || "Untitled Proposal"))
                      if (!name) return
                      try {
                        const res = await fetch("/api/proposals/drafts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id, title: name }) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok) {
                          toast.success("Draft renamed")
                          await loadDrafts()
                        } else {
                          toast.error(String(json?.error || "Rename failed"))
                        }
                      } catch {}
                    }}>Rename</Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const payload = { client: d.client, crmId: d.crmId, title: String(d.title||"")+" (copy)", items: d.items, taxRate: d.taxRate, discount: d.discount, notes: d.notes }
                        const res = await fetch("/api/proposals/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok) {
                          toast.success("Draft duplicated")
                          await loadDrafts()
                        } else {
                          toast.error(String(json?.error || "Duplicate failed"))
                        }
                      } catch {}
                    }}>Duplicate</Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const res = await fetch("/api/proposals/drafts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok) {
                          toast.success("Draft deleted")
                          await loadDrafts()
                        } else {
                          toast.error(String(json?.error || "Delete failed"))
                        }
                      } catch {}
                    }}>Delete</Button>
                  </div>
                </div>
              ))
            )}
      {draftTotal > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page<=1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page>=totalPages}>Next</Button>
          </div>
        </div>
      )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground mb-3">Client Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 relative" ref={crmRef}>
                <input
                  className="p-2 border border-border/40 rounded-md bg-background text-foreground w-full"
                  placeholder="Search CRM (name/email/company)"
                  value={crmQuery}
                  onChange={(e) => setCrmQuery(e.target.value)}
                  onFocus={() => setCrmOpen(true)}
                />
                {crmOpen && (
                  <div className="absolute z-10 mt-1 w-full border border-border/40 rounded-md bg-background shadow-sm max-h-48 overflow-auto">
                    {crmLoading ? (
                      <div className="p-2 text-xs text-muted-foreground">Searching…</div>
                    ) : crmResults.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">No matches</div>
                    ) : (
                      crmResults.map((c: any) => (
                        <button
                          type="button"
                          key={String(c?.id || Math.random())}
                          className="w-full text-left p-2 hover:bg-muted"
                          onClick={() => selectCrm(c)}
                        >
                          <div className="text-sm text-foreground">{String(c?.name || "")}</div>
                          <div className="text-xs text-muted-foreground">{String(c?.email || "")} • {String(c?.company || "")}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {crmSelectedId && (
                <div className="md:col-span-2 flex items-center justify-between p-2 border border-border/40 rounded-md bg-background">
                  <div className="text-xs text-muted-foreground">
                    Linked CRM: <span className="text-foreground font-medium">{clientName || "—"}</span>{clientEmail ? ` • ${clientEmail}` : ""} <span className="text-muted-foreground">({crmSelectedId})</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs underline text-muted-foreground hover:text-foreground"
                    onClick={() => setCrmSelectedId("")}
                  >
                    Clear link
                  </button>
                  <a
                    href={`/admin/crm?contact=${encodeURIComponent(crmSelectedId)}`}
                    className="ml-2 text-xs underline text-muted-foreground hover:text-foreground"
                  >
                    Open in CRM
                  </a>
                </div>
              )}
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
                className="p-2 border border-border/40 rounded-md bg-background text-foreground"
                placeholder="Phone (optional)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
              <input
                className="p-2 border border-border/40 rounded-md bg-background text-foreground md:col-span-2"
                placeholder="Company (optional)"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
              {!crmSelectedId && (clientName.trim() || clientEmail.trim()) && (
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/crm/contacts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: clientName, email: clientEmail, phone: clientPhone, company: clientCompany }),
                        })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok && json?.id) {
                          setCrmSelectedId(String(json.id))
                          toast.success("Added to CRM")
                        } else {
                          toast.error(String(json?.error || "Failed to add to CRM"))
                        }
                      } catch {}
                    }}
                  >
                    Add to CRM
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/crm/leads", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: clientName, email: clientEmail, phone: clientPhone, company: clientCompany, source: "Proposal", notes: title }),
                        })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok && json?.id) {
                          setCreatedLeadId(String(json.id))
                          toast.success("Lead created")
                        } else {
                          toast.error(String(json?.error || "Failed to create lead"))
                        }
                      } catch {}
                    }}
                  >
                    Create Lead
                  </Button>
                  {createdLeadId && (
                    <a href={`/admin/crm?lead=${encodeURIComponent(createdLeadId)}`} className="text-xs underline text-muted-foreground hover:text-foreground">
                      Open lead in CRM
                    </a>
                  )}
                </div>
              )}
              {crmSelectedId && (
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const payload = { title, contact_id: crmSelectedId, value: total, next_activity: "Proposal created", due_date: validUntil }
                        const res = await fetch("/api/crm/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok && json?.id) {
                          setCreatedDealId(String(json.id))
                          toast.success("Deal created")
                        } else {
                          toast.error(String(json?.error || "Failed to create deal"))
                        }
                      } catch {}
                    }}
                  >
                    Create Deal
                  </Button>
                  {createdDealId && (
                    <a href={`/admin/crm?deal=${encodeURIComponent(createdDealId)}`} className="text-xs underline text-muted-foreground hover:text-foreground">
                      Open deal in CRM
                    </a>
                  )}
                </div>
              )}
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
                  <div className="text-sm text-muted-foreground">{clientPhone || ""}</div>
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
                      <th className="text-left font-medium pb-2">Category</th>
                      <th className="text-left font-medium pb-2">Set</th>
                      <th className="text-left font-medium pb-2">Room</th>
                      <th className="text-left font-medium pb-2">Meters</th>
                      <th className="text-left font-medium pb-2">Rate</th>
                      <th className="text-left font-medium pb-2">Details</th>
                      <th className="text-left font-medium pb-2">Install</th>
                      <th className="text-right font-medium pb-2">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewBreakdown.map((r) => (
                      <tr key={r.id} className="border-t border-border/40">
                        <td className="p-2 capitalize">{r.category || "—"}</td>
                        <td className="p-2">{r.set}</td>
                        <td className="p-2">{r.room}</td>
                        <td className="p-2">{r.meters}</td>
                        <td className="p-2">₱{r.rate.toLocaleString()}/m</td>
                        <td className="p-2 whitespace-pre-wrap">{r.details || "—"}</td>
                        <td className="p-2">{r.installTxt}</td>
                        <td className="p-2 text-right">₱{r.totalLine.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/40">
                      <td colSpan={7} className="text-right py-2">Subtotal</td>
                      <td className="text-right py-2" colSpan={1}>₱{subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="text-right py-2">Tax ({taxRate}%)</td>
                      <td className="text-right py-2" colSpan={1}>₱{tax.toLocaleString()}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td colSpan={7} className="text-right py-2">Discount</td>
                        <td className="text-right py-2" colSpan={1}>-₱{discount.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t border-border/40">
                      <td colSpan={7} className="text-right py-2 font-semibold">Total</td>
                      <td className="text-right py-2 font-semibold" colSpan={1}>₱{total.toLocaleString()}</td>
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
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Set</th>
                      <th className="text-left p-2">Room</th>
                      <th className="text-left p-2">Meters</th>
                      <th className="text-left p-2">Rate</th>
                      <th className="text-left p-2">Details</th>
                      <th className="text-left p-2">Install</th>
                      <th className="text-right p-2">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiPreviewBreakdown.map((r)=> (
                      <tr key={r.id} className="border-t">
                        <td className="p-2 capitalize">{r.category || "—"}</td>
                        <td className="p-2">{r.set}</td>
                        <td className="p-2">{r.room}</td>
                        <td className="p-2">{r.meters}</td>
                        <td className="p-2">₱{r.rate.toLocaleString()}/m</td>
                        <td className="p-2 whitespace-pre-wrap">{r.details || "—"}</td>
                        <td className="p-2">{r.installTxt}</td>
                        <td className="p-2 text-right">₱{r.totalLine.toLocaleString()}</td>
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

// Keyboard shortcuts
export function useAdminDraftsShortcuts(searchRef: React.RefObject<HTMLInputElement>, page: number, totalPages: number, setPage: (p: number) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (["INPUT", "TEXTAREA", "SELECT"].includes(String(tag))) return
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return }
      if (e.key === "ArrowLeft") { e.preventDefault(); if (page > 1) setPage(Math.max(1, page-1)); return }
      if (e.key === "ArrowRight") { e.preventDefault(); if (page < totalPages) setPage(Math.min(totalPages, page+1)); return }
    }
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("keydown", onKey) }
  }, [page, totalPages])
}
