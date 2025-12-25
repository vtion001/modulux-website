"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Trash2, Mail, Sparkles, FolderOpen, History, Send, Save } from "lucide-react"
import { estimateCabinetCost } from "@/lib/estimator"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
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
  category?: string
  setId?: string | number
  room?: string
  baseRate?: number
  tierFactor?: number
  materialFactor?: number
  finishFactor?: number
  hardwareFactor?: number
  installationAdd?: number
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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [emailFormat, setEmailFormat] = useState<"text" | "html">("text")
  const [attachHtml, setAttachHtml] = useState(false)
  const [sendToSelf, setSendToSelf] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string>("")
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sentOpen, setSentOpen] = useState(false)
  const [sentProposals, setSentProposals] = useState<any[]>([])
  const [sentLoading, setSentLoading] = useState(false)
  const [sentQuery, setSentQuery] = useState("")
  const [debouncedSentQuery, setDebouncedSentQuery] = useState("")
  const [sentPage, setSentPage] = useState(1)
  const [sentTotal, setSentTotal] = useState(0)
  const [sentSortKey, setSentSortKey] = useState("created_desc")

  // Autofill title based on client info
  useEffect(() => {
    if (clientName && (title === "Kitchen Cabinet Proposal" || !title)) {
      const suffix = "Kitchen Cabinet Proposal"
      const clientPart = clientCompany ? `${clientName} (${clientCompany})` : clientName
      setTitle(`${clientPart} - ${suffix}`)
    }
  }, [clientName, clientCompany])
  const [showSnippets, setShowSnippets] = useState(false)
  const [snippets, setSnippets] = useState<any[]>([])
  const [snippetManagerOpen, setSnippetManagerOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<any>(null)
  const snippetsRef = useRef<HTMLDivElement>(null)

  const loadSnippets = async () => {
    try {
      const res = await fetch("/api/proposals/snippets", { cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      setSnippets(Array.isArray(json?.snippets) ? json.snippets : [])
    } catch { }
  }

  useEffect(() => {
    loadSnippets()
  }, [])
  useAdminDraftsShortcuts(searchInputRef, page, totalPages, (p: number) => setPage(p))

  useEffect(() => {
    ; (async () => {
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
      } catch { }
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
      ; (async () => {
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
    const aiTs = searchParams.get("aiTs")
    if (aiTs && !aiOpen) {
      setAiOpen(true)
      setSelectedVersionTs(aiTs)
    }
  }, [searchParams, aiOpen])

  useEffect(() => {
    if (!aiOpen) return
      ; (async () => {
        try {
          const res = await fetch("/api/pricing/versions", { cache: "no-store" })
          const json = await res.json().catch(() => ({}))
          const arr = Array.isArray(json?.versions) ? json.versions : []
          setVersions(arr)
          if (selectedVersionTs) {
            const hit = arr.find((v: any) => String(v.ts) === selectedVersionTs)
            if (hit) buildPreviewFromVersion(hit)
          }
        } catch { }
      })()
  }, [aiOpen, selectedVersionTs])

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
        items: u.items,
        exclusive: u.exclusive,
      }))
      const legacyLm = typeof form.linearMeter === "string" ? parseFloat(form.linearMeter) : Number(form.linearMeter || 0)
      const useLegacy = Number.isFinite(legacyLm) && legacyLm > 0 && units.every((u: any) => !(u.meters > 0))
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
      const tierStr = String(pre?.tier || "luxury")
      const specDefault = tierSpecs[tierStr] || { items: [], exclusive: [] }
      const itemsMapped: ProposalItem[] = (calc?.breakdown?.units || []).map((u: any) => {
        const materialTxt = String(u.material || "").replace(/_/g, " ")
        const finishTxt = String(u.finish || "").replace(/_/g, " ")
        const hardwareTxt = String(u.hardware || "").replace(/_/g, " ")
        const specIncluded = Array.isArray(u.items) ? u.items.join(", ") : (specDefault.items.join(", "))
        const specExclusive = Array.isArray(u.exclusive) ? u.exclusive.join(", ") : (specDefault.exclusive.join(", "))
        const details = [
          `Tier: ${String(u.tier || pre?.tier || "luxury")}`,
          materialTxt ? `Material: ${materialTxt}` : null,
          finishTxt ? `Finish: ${finishTxt}` : null,
          hardwareTxt ? `Hardware: ${hardwareTxt}` : null,
          `Meters: ${Number(u.meters || 0)}`,
          `Rate: ₱${Number(u.baseRate || 0).toLocaleString()}/m`,
          `Factors: ×${Number(u.tierFactor || 1)} ×${Number(u.materialFactor || 1)} ×${Number(u.finishFactor || 1)} ×${Number(u.hardwareFactor || 1)}`,
          Number(u.installationAdd || 0) ? `Install add: ₱${Number(u.installationAdd || 0).toLocaleString()}` : null,
          specIncluded ? `Included: ${specIncluded}` : null,
          specExclusive ? `Exclusive: ${specExclusive}` : null,
        ].filter(Boolean).join("\n")
        return {
          id: crypto.randomUUID(),
          description: `${u.category} cabinets (${String(u.tier || pre?.tier || "luxury")})`,
          quantity: Number(u.meters || 0),
          unitPrice: Number(u.meters || 0) > 0 ? Math.round(Number(u.lineTotal || 0) / Number(u.meters)) : 0,
          details,
          category: u.category,
          setId: u.setId,
          room: u.room || "Kitchen",
          baseRate: u.baseRate,
          tierFactor: u.tierFactor,
          materialFactor: u.materialFactor,
          finishFactor: u.finishFactor,
          hardwareFactor: u.hardwareFactor,
          installationAdd: u.installationAdd,
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
    } catch (e) {
      console.error(e)
    }
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

  const loadSentProposals = async () => {
    try {
      setSentLoading(true)
      const params = new URLSearchParams()
      if (debouncedSentQuery.trim()) params.set("q", debouncedSentQuery.trim())
      params.set("sort", sentSortKey)
      params.set("page", String(sentPage))
      params.set("pageSize", String(pageSize))
      const res = await fetch(`/api/proposals/sent?${params.toString()}`, { cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      const arr = Array.isArray(json?.proposals) ? json.proposals : []
      setSentProposals(arr)
      setSentTotal(Number(json?.total || arr.length))
    } finally {
      setSentLoading(false)
    }
  }

  useEffect(() => {
    loadSentProposals()
  }, [debouncedSentQuery, sentSortKey, sentPage, pageSize])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSentQuery(sentQuery)
    }, 300)
    return () => clearTimeout(t)
  }, [sentQuery])

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
    } catch { }
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
      let installTxt = "₱0"
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
      let installTxt = "₱0"
      const instMatch = details.match(/Install add:\s*₱([0-9,\.]+)/)
      if (instMatch) installTxt = `₱${instMatch[1]}`
      const meters = Number(x.quantity || 0)
      const rate = Number(x.unitPrice || 0)
      const totalLine = Math.round(meters * rate)
      return { category, set: 1, room: roomGuess, meters, rate, details, installTxt, totalLine, id: x.id }
    })
  }, [aiPreviewItems, aiPreviewTitle, title])

  const buildEmailText = () => {
    const nf = new Intl.NumberFormat("en-PH")
    const linesTxt = previewBreakdown.map((r) => {
      const rateTxt = `₱${nf.format(Number(r.rate || 0))}`
      const lineTxt = `₱${nf.format(Number(r.totalLine || 0))}`
      const mTxt = `${Number(r.meters || 0)}m`
      return `- ${String(r.category || "")} • Set ${String(r.set || 1)} • ${String(r.room || "")} • ${mTxt} @ ${rateTxt} • Install ${String(r.installTxt || "₱0")} • Line ${lineTxt}\n  Details: ${String(r.details || "")}`
    }).join("\n")
    const subtotalTxt = `₱${nf.format(Number(subtotal || 0))}`
    const taxTxt = `₱${nf.format(Number(tax || 0))}`
    const discountTxt = `₱${nf.format(Number(discount || 0))}`
    const totalTxt = `₱${nf.format(Number(total || 0))}`
    const header = [
      `Proposal Preview`,
      `Client: ${String(clientName || "")}${clientCompany ? ` • ${clientCompany}` : ""}${clientPhone ? ` • ${clientPhone}` : ""}`,
      `Email: ${String(clientEmail || "")}`,
      `Title: ${String(title || "Proposal")}`,
      `Issue Date: ${String(issueDate || "")}`,
      `Valid Until: ${String(validUntil || "")}`,
      `Notes: ${String(notes || "")}`,
    ].join("\n")
    const totals = [`Subtotal: ${subtotalTxt}`, `Tax: ${taxTxt}`, `Discount: ${discountTxt}`, `Total: ${totalTxt}`].join("\n")
    return `${header}\n\nItems:\n${linesTxt}\n\n${totals}`
  }

  const buildEmailHtml = () => {
    const nf = new Intl.NumberFormat("en-PH")
    const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    const logoUrl = "https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
    const header = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div style="display:flex;gap:16px;align-items:flex-start">
          <img src="${logoUrl}" alt="ModuLux Logo" style="width:240px;height:80px;border:1px solid #e5e7eb;border-radius:8px;object-fit:cover" />
          <div>
            <div style="font-size:24px;font-weight:700;color:#111827">${esc(title || "Proposal")}</div>
            <div style="font-size:14px;color:#6b7280">Issue date: ${esc(issueDate || "—")}</div>
            <div style="font-size:14px;color:#6b7280">Valid until: ${esc(validUntil || "—")}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:600;color:#111827">ModuLux</div>
          <div style="font-size:14px;color:#6b7280">sales@modulux.ph</div>
        </div>
      </div>
    `
    const clientSummary = `
      <div style="display:flex;gap:16px;margin-top:16px">
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
          <div style="font-size:12px;color:#6b7280">Client</div>
          <div style="font-size:14px;font-weight:600;color:#111827">${esc(clientName || "—")}</div>
          <div style="font-size:14px;color:#6b7280">${esc(clientEmail || "")}</div>
          <div style="font-size:14px;color:#6b7280">${esc(clientPhone || "")}</div>
          <div style="font-size:14px;color:#6b7280">${esc(clientCompany || "")}</div>
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
          <div style="font-size:12px;color:#6b7280">Summary</div>
          <div style="font-size:14px;color:#6b7280">${esc(notes || "No notes provided.")}</div>
        </div>
      </div>
    `
    const rows = previewBreakdown.map((r) => {
      const rateTxt = `₱${nf.format(Number(r.rate || 0))}/m`
      const lineTxt = `₱${nf.format(Number(r.totalLine || 0))}`
      const mTxt = `${Number(r.meters || 0)}`
      const detailsSafe = esc(r.details || "").replace(/\n/g, "<br>")
      return `<tr style="border-top:1px solid #e5e7eb">
        <td style="padding:8px">${esc(r.category || "")}</td>
        <td style="padding:8px">${esc(String(r.set || 1))}</td>
        <td style="padding:8px">${esc(r.room || "")}</td>
        <td style="padding:8px">${mTxt}</td>
        <td style="padding:8px">${rateTxt}</td>
        <td style="padding:8px;color:#374151">${detailsSafe}</td>
        <td style="padding:8px">${esc(r.installTxt || "₱0")}</td>
        <td style="padding:8px;text-align:right">${lineTxt}</td>
      </tr>`
    }).join("")
    const subtotalTxt = `₱${nf.format(Number(subtotal || 0))}`
    const taxTxt = `₱${nf.format(Number(tax || 0))}`
    const discountTxt = `₱${nf.format(Number(discount || 0))}`
    const totalTxt = `₱${nf.format(Number(total || 0))}`
    const table = `
      <table style="width:100%;font-size:14px;margin-top:16px;border-collapse:collapse">
        <thead>
          <tr style="color:#6b7280;border-bottom:1px solid #e5e7eb">
            <th style="text-align:left;padding:8px">Category</th>
            <th style="text-align:left;padding:8px">Set</th>
            <th style="text-align:left;padding:8px">Room</th>
            <th style="text-align:left;padding:8px">Meters</th>
            <th style="text-align:left;padding:8px">Rate</th>
            <th style="text-align:left;padding:8px">Details</th>
            <th style="text-align:left;padding:8px">Install</th>
            <th style="text-align:right;padding:8px">Line Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:1px solid #e5e7eb">
            <td colspan="7" style="text-align:right;padding:8px">Subtotal</td>
            <td style="text-align:right;padding:8px">${subtotalTxt}</td>
          </tr>
          <tr>
            <td colspan="7" style="text-align:right;padding:8px">Tax (${taxRate}%)</td>
            <td style="text-align:right;padding:8px">${taxTxt}</td>
          </tr>
          ${discount > 0 ? `<tr><td colspan="7" style="text-align:right;padding:8px">Discount</td><td style="text-align:right;padding:8px">-${discountTxt}</td></tr>` : ""}
          <tr style="border-top:1px solid #e5e7eb">
            <td colspan="7" style="text-align:right;padding:8px;font-weight:600">Total</td>
            <td style="text-align:right;padding:8px;font-weight:600">${totalTxt}</td>
          </tr>
        </tfoot>
      </table>
    `
    const footer = `<div style="margin-top:16px;font-size:12px;color:#6b7280">This is a proposal document generated for review purposes. Final scope and pricing may vary based on site survey and material selection.</div>`
    const card = `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.06);overflow:hidden">
        <div style="padding:12px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
          <div style="font-weight:600">Preview</div>
          <div style="font-size:14px;color:#6b7280">Just now</div>
        </div>
        <div style="padding:24px">${header}${clientSummary}${table}${footer}</div>
      </div>
    `
    const wrapper = `<div style="max-width:1024px;margin:0 auto;padding:16px;font-family:ui-sans-serif,system-ui,-apple-system;line-height:1.5;color:#111827">${card}</div>`
    return wrapper
  }

  const safeBase64 = (s: string) => {
    try {
      if (typeof TextEncoder !== 'undefined') {
        const bytes = new TextEncoder().encode(s)
        let ascii = ''
        for (let i = 0; i < bytes.length; i++) ascii += String.fromCharCode(bytes[i])
        return btoa(ascii)
      }
    } catch { }
    try {
      // Fallback for environments with Buffer
      // eslint-disable-next-line no-undef
      return Buffer.from(s, 'utf-8').toString('base64')
    } catch {
      return btoa(s)
    }
  }

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch('/api/admin/email-config', { cache: 'no-store' })
        const cfg = await res.json().catch(() => ({}))
        const admin = String(cfg?.reply_to || cfg?.from_email || '')
        if (admin) setAdminEmail(admin)
      } catch { }
    })()
  }, [])

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
              <SaveForm action={saveDraft}>
                <SubmitButton
                  confirm="Save this proposal as a draft?"
                  disabled={savingDraft}
                  aria-busy={savingDraft}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 px-4 py-2 text-black dark:text-white"
                >
                  <Save className="w-4 h-4" />
                  {savingDraft ? "Saving…" : "Save Draft"}
                </SubmitButton>
              </SaveForm>
              <SaveForm action={async () => {
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
                    try {
                      if (crmSelectedId) {
                        const dres = await fetch("/api/crm/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, contact_id: crmSelectedId, value: total, next_activity: "Proposal submitted", due_date: validUntil }) })
                        const djson = await dres.json().catch(() => ({}))
                        if (dres.ok && djson?.ok && djson?.id) {
                          toast.success(
                            <span>
                              Deal created: {String(djson.id)} •{" "}
                              <a href={`/admin/crm?deal=${encodeURIComponent(String(djson.id))}`} className="underline">Open</a>
                            </span>,
                            {
                              action: {
                                label: "Copy Link",
                                onClick: () => {
                                  const url = `${window.location.origin}/admin/crm?deal=${encodeURIComponent(String(djson.id))}`
                                  navigator.clipboard.writeText(url)
                                },
                              },
                            }
                          )
                        }
                      } else if (clientName.trim() || clientEmail.trim()) {
                        const lres = await fetch("/api/crm/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clientName, email: clientEmail, phone: clientPhone, company: clientCompany, source: "Proposal", notes: title }) })
                        const ljson = await lres.json().catch(() => ({}))
                        if (lres.ok && ljson?.ok && ljson?.id) {
                          toast.success(
                            <span>
                              Lead created: {String(ljson.id)} •{" "}
                              <a href={`/admin/crm?lead=${encodeURIComponent(String(ljson.id))}`} className="underline">Open</a>
                            </span>,
                            {
                              action: {
                                label: "Copy Link",
                                onClick: () => {
                                  const url = `${window.location.origin}/admin/crm?lead=${encodeURIComponent(String(ljson.id))}`
                                  navigator.clipboard.writeText(url)
                                },
                              },
                            }
                          )
                        }
                      }
                    } catch { }
                    toast.success("Proposal submitted")
                    loadSentProposals()
                    window.location.href = `/admin/proposals?id=${encodeURIComponent(data.id)}`
                  } else {
                    toast.error(String(data?.error || "Submission failed"))
                  }
                } catch { }
                finally {
                  setSubmitting(false)
                }
              }}>
                <SubmitButton
                  confirm="Are you sure you want to submit this proposal? This will also create a Deal/Lead in the CRM."
                  disabled={submitting}
                  aria-busy={submitting}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 px-4 py-2 text-black dark:text-white"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting…" : "Submit"}
                </SubmitButton>
              </SaveForm>
              <Button
                variant="outline"
                onClick={() => {
                  if (!clientEmail || !clientEmail.trim()) { toast.error("Add a client email first"); return }
                  const subject = `Proposal Preview: ${String(title || "Proposal")}`
                  const text = buildEmailText()
                  setEmailSubject(subject)
                  setEmailBody(text)
                  setEmailPreviewOpen(true)
                }}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 text-black dark:text-white"
              >
                <Mail className="w-4 h-4" />
                Email Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 text-black dark:text-white"
              >
                <Sparkles className="w-4 h-4" />
                AI Fill
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraftsOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 text-black dark:text-white"
              >
                <FolderOpen className="w-4 h-4" />
                View Drafts
              </Button>
              <Button
                variant="outline"
                onClick={() => setSentOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 text-black dark:text-white"
              >
                <History className="w-4 h-4" />
                View Sent
              </Button>
            </div>
          </div>
        </div>
      </div>
      {draftsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDraftsOpen(false)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-card border border-border/40 rounded-xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm pb-4 border-b z-10">
              <div>
                <h3 className="text-xl font-bold">Proposal Drafts</h3>
                <p className="text-xs text-muted-foreground">Manage your saved proposal drafts</p>
              </div>
              <button onClick={() => setDraftsOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="Search drafts by title, client, or email"
                  className="flex-1 min-w-[200px] p-2 border rounded-md bg-background text-foreground text-sm"
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
                  onChange={(e) => { const v = Number(e.target.value) || 10; setPageSize(v); setPage(1) }}
                  className="p-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="text-xs text-muted-foreground">Press / to focus search, ←/→ to paginate</div>
              {draftsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading drafts...</div>
              ) : (
                <div className="space-y-3">
                  {drafts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No drafts found.</div>
                  ) : (
                    drafts.map((d: any, idx: number) => (
                      <div key={d.id || `draft_full_${idx}`} className="flex items-center justify-between gap-3 border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{String(d.title || "Untitled Proposal")}</div>
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {String(d?.client?.name || "No client")} • {new Date(d.updated_at || d.created_at || Date.now()).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => {
                            setClientName(String(d?.client?.name || ""))
                            setClientEmail(String(d?.client?.email || ""))
                            setClientCompany(String(d?.client?.company || ""))
                            setClientPhone(String(d?.client?.phone || ""))
                            setCrmSelectedId(String(d?.crmId || ""))
                            setTitle(String(d?.title || "Proposal"))
                            setItems((Array.isArray(d?.items) ? d.items : []).map((x: any) => ({
                              id: crypto.randomUUID(),
                              description: String(x?.description || ""),
                              quantity: Number(x?.quantity || 0),
                              unitPrice: Number(x?.unitPrice || 0),
                              details: String(x?.details || ""),
                              category: x?.category,
                              setId: x?.setId,
                              room: x?.room,
                              baseRate: x?.baseRate,
                              tierFactor: x?.tierFactor,
                              materialFactor: x?.materialFactor,
                              finishFactor: x?.finishFactor,
                              hardwareFactor: x?.hardwareFactor,
                              installationAdd: x?.installationAdd
                            })))
                            setTaxRate(Number(d?.taxRate || 0))
                            setDiscount(Number(d?.discount || 0))
                            setNotes(String(d?.notes || ""))
                            setDraftsOpen(false)
                            toast.success("Draft loaded")
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
                            } catch { }
                          }}>Rename</Button>
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              const payload = { client: d.client, crmId: d.crmId, title: String(d.title || "") + " (copy)", items: d.items, taxRate: d.taxRate, discount: d.discount, notes: d.notes }
                              const res = await fetch("/api/proposals/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                              const json = await res.json().catch(() => ({}))
                              if (res.ok && json?.ok) {
                                toast.success("Draft duplicated")
                                await loadDrafts()
                              } else {
                                toast.error(String(json?.error || "Duplicate failed"))
                              }
                            } catch { }
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
                            } catch { }
                          }}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                  {draftTotal > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">Page {page} of {totalPages} • {draftTotal} total drafts</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm" style={{ display: "none" }}>
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
            onChange={(e) => { const v = Number(e.target.value) || 10; setPageSize(v); setPage(1) }}
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
              drafts.map((d: any, idx: number) => (
                <div key={d.id || `draft_mini_${idx}`} className="flex items-center justify-between gap-3 border rounded p-2 text-xs">
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
                      setItems((Array.isArray(d?.items) ? d.items : []).map((x: any) => ({
                        id: crypto.randomUUID(),
                        description: String(x?.description || ""),
                        quantity: Number(x?.quantity || 0),
                        unitPrice: Number(x?.unitPrice || 0),
                        details: String(x?.details || ""),
                        category: x?.category,
                        setId: x?.setId,
                        room: x?.room,
                        baseRate: x?.baseRate,
                        tierFactor: x?.tierFactor,
                        materialFactor: x?.materialFactor,
                        finishFactor: x?.finishFactor,
                        hardwareFactor: x?.hardwareFactor,
                        installationAdd: x?.installationAdd
                      })))
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
                      } catch { }
                    }}>Rename</Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const payload = { client: d.client, crmId: d.crmId, title: String(d.title || "") + " (copy)", items: d.items, taxRate: d.taxRate, discount: d.discount, notes: d.notes }
                        const res = await fetch("/api/proposals/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok) {
                          toast.success("Draft duplicated")
                          await loadDrafts()
                        } else {
                          toast.error(String(json?.error || "Duplicate failed"))
                        }
                      } catch { }
                    }}>Duplicate</Button>
                    <SaveForm action={async () => {
                      try {
                        const res = await fetch("/api/proposals/drafts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) })
                        const json = await res.json().catch(() => ({}))
                        if (res.ok && json?.ok) {
                          toast.success("Draft deleted")
                          await loadDrafts()
                        } else {
                          toast.error(String(json?.error || "Delete failed"))
                        }
                      } catch { }
                    }}>
                      <SubmitButton
                        type="danger"
                        confirm={`Are you sure you want to delete the draft "${d.title || "Untitled Proposal"}"?`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        Delete
                      </SubmitButton>
                    </SaveForm>
                  </div>
                </div>
              ))
            )}
            {draftTotal > 0 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
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
                      crmResults.map((c: any, idx: number) => (
                        <button
                          type="button"
                          key={c.id || `crm_search_${idx}`}
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
                  <SaveForm action={async () => {
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
                    } catch { }
                  }}>
                    <SubmitButton
                      variant="outline"
                      confirm="Add this client to your CRM contacts?"
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      Add to CRM
                    </SubmitButton>
                  </SaveForm>
                  <SaveForm action={async () => {
                    try {
                      const res = await fetch("/api/crm/leads", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: clientName, email: clientEmail, phone: clientPhone, company: clientCompany, source: "Proposal", notes: title }),
                      })
                      const json = await res.json().catch(() => ({}))
                      if (res.ok && json?.ok && json?.id) {
                        setCreatedLeadId(String(json.id))
                        toast.success(
                          <span>
                            Lead created: {String(json.id)} •{" "}
                            <a href={`/admin/crm?lead=${encodeURIComponent(String(json.id))}`} className="underline">Open</a>
                          </span>,
                          {
                            action: {
                              label: "Copy Link",
                              onClick: () => {
                                const url = `${window.location.origin}/admin/crm?lead=${encodeURIComponent(String(json.id))}`
                                navigator.clipboard.writeText(url)
                              },
                            },
                          }
                        )
                      } else {
                        toast.error(String(json?.error || "Failed to create lead"))
                      }
                    } catch { }
                  }}>
                    <SubmitButton
                      variant="outline"
                      confirm="Create a new CRM lead for this client?"
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      Create Lead
                    </SubmitButton>
                  </SaveForm>
                  {createdLeadId && (
                    <a href={`/admin/crm?lead=${encodeURIComponent(createdLeadId)}`} className="text-xs underline text-muted-foreground hover:text-foreground">
                      Open lead in CRM
                    </a>
                  )}
                </div>
              )}
              {crmSelectedId && (
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <SaveForm action={async () => {
                    try {
                      const payload = { title, contact_id: crmSelectedId, value: total, next_activity: "Proposal created", due_date: validUntil }
                      const res = await fetch("/api/crm/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                      const json = await res.json().catch(() => ({}))
                      if (res.ok && json?.ok && json?.id) {
                        setCreatedDealId(String(json.id))
                        toast.success(
                          <span>
                            Deal created: {String(json.id)} •{" "}
                            <a href={`/admin/crm?deal=${encodeURIComponent(String(json.id))}`} className="underline">Open</a>
                          </span>,
                          {
                            action: {
                              label: "Copy Link",
                              onClick: () => {
                                const url = `${window.location.origin}/admin/crm?deal=${encodeURIComponent(String(json.id))}`
                                navigator.clipboard.writeText(url)
                              },
                            },
                          }
                        )
                      } else {
                        toast.error(String(json?.error || "Failed to create deal"))
                      }
                    } catch { }
                  }}>
                    <SubmitButton
                      variant="outline"
                      confirm="Create a new CRM deal for this proposal?"
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      Create Deal
                    </SubmitButton>
                  </SaveForm>
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
              <div className="space-y-1 md:col-span-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <div className="relative" ref={snippetsRef}>
                    <button
                      type="button"
                      onClick={() => setShowSnippets(!showSnippets)}
                      className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" /> Snippets
                    </button>
                    {showSnippets && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border shadow-xl rounded-md z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground border-b border-border/40 uppercase tracking-widest">Select Snippet</div>
                        {snippets.map((s, idx) => (
                          <button
                            key={s.id || idx}
                            type="button"
                            className="w-full text-left px-3 py-2 text-[11px] hover:bg-muted transition-colors border-b border-border/10 last:border-0"
                            onClick={() => {
                              const newNotes = notes ? (notes.trim() + "\n\n" + s.content) : s.content
                              setNotes(newNotes)
                              setShowSnippets(false)
                              toast.success(`Added ${s.label}`)
                            }}
                          >
                            <div className="font-semibold text-foreground">{s.label}</div>
                            <div className="text-[9px] text-muted-foreground truncate opacity-70">Insert terms and conditions...</div>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-[10px] bg-muted/50 hover:bg-muted text-primary font-bold flex items-center gap-1.5"
                          onClick={() => {
                            setSnippetManagerOpen(true)
                            setShowSnippets(false)
                          }}
                        >
                          <FileText className="w-3 h-3" /> Manage Snippets
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <table className="w-full text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="p-2 text-left font-medium text-muted-foreground w-20">Category</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Set</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-20">Room</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">Description</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Qty/m</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-20">Rate</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Tier</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Mat</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Fin</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-12">Hw</th>
                    <th className="p-2 text-left font-medium text-muted-foreground w-24">Install</th>
                    <th className="p-2 text-right font-medium text-muted-foreground w-24">Total</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-1">
                        <input
                          className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded capitalize"
                          value={item.category || ""}
                          onChange={(e) => updateItem(item.id, { category: e.target.value })}
                          placeholder="base"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded text-center"
                          value={item.setId || ""}
                          onChange={(e) => updateItem(item.id, { setId: e.target.value })}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded"
                          value={item.room || ""}
                          onChange={(e) => updateItem(item.id, { room: e.target.value })}
                          placeholder="Kitchen"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded font-medium"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Description"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-1">
                        <div className="flex items-center gap-1 group">
                          <span className="text-muted-foreground shrink-0">₱</span>
                          <input
                            type="number"
                            className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded p-0"
                            value={item.baseRate ?? item.unitPrice}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0
                              if (item.baseRate !== undefined) updateItem(item.id, { baseRate: v })
                              else updateItem(item.id, { unitPrice: v })
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-1 text-muted-foreground text-[10px]">
                        {item.tierFactor ? `×${item.tierFactor}` : "—"}
                      </td>
                      <td className="p-1 text-muted-foreground text-[10px]">
                        {item.materialFactor ? `×${item.materialFactor}` : "—"}
                      </td>
                      <td className="p-1 text-muted-foreground text-[10px]">
                        {item.finishFactor ? `×${item.finishFactor}` : "—"}
                      </td>
                      <td className="p-1 text-muted-foreground text-[10px]">
                        {item.hardwareFactor ? `×${item.hardwareFactor}` : "—"}
                      </td>
                      <td className="p-1">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground shrink-0">₱</span>
                          <input
                            type="number"
                            className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-primary rounded"
                            value={item.installationAdd || 0}
                            onChange={(e) => updateItem(item.id, { installationAdd: Number(e.target.value) || 0 })}
                          />
                        </div>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ₱{Math.round(item.baseRate
                          ? (item.baseRate * item.quantity * (item.tierFactor || 1) * (item.materialFactor || 1) * (item.finishFactor || 1) * (item.hardwareFactor || 1) + (item.installationAdd || 0))
                          : (item.quantity * item.unitPrice)
                        ).toLocaleString()}
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>Full Preview</Button>
            </div>
            <div className="p-6 space-y-6 max-h-[800px] overflow-y-auto">
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

              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Client</div>
                <div className="text-sm font-medium text-foreground">{clientName || "—"}</div>
                <div className="text-sm text-muted-foreground">{clientEmail || ""}</div>
                <div className="text-sm text-muted-foreground">{clientPhone || ""}</div>
                <div className="text-sm text-muted-foreground">{clientCompany || ""}</div>
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
                    {previewBreakdown.map((r, idx) => (
                      <tr key={r.id || `breakdown_${idx}`} className="border-t border-border/40">
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

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">This is a proposal document generated for review purposes. Final scope and pricing may vary based on site survey and material selection.</div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Summary</div>
                  <div className="text-sm text-muted-foreground">{notes || "No notes provided."}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-auto bg-card border border-border/40 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Proposal Preview</h3>
                <p className="text-xs text-muted-foreground">Full document view</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <img
                    src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
                    alt="ModuLux Logo"
                    className="w-72 h-24 rounded-lg border border-border/40 object-cover"
                  />
                  <div>
                    <div className="text-3xl font-bold text-foreground mb-2">{title || "Untitled Proposal"}</div>
                    <div className="text-base text-muted-foreground">Issue date: {issueDate || "—"}</div>
                    <div className="text-base text-muted-foreground">Valid until: {validUntil || "—"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-foreground">ModuLux</div>
                  <div className="text-base text-muted-foreground">sales@modulux.ph</div>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 p-5 bg-muted/20">
                <div className="text-sm font-semibold text-muted-foreground mb-3">Client Information</div>
                <div className="text-lg font-bold text-foreground">{clientName || "—"}</div>
                <div className="text-base text-muted-foreground mt-1">{clientEmail || ""}</div>
                <div className="text-base text-muted-foreground">{clientPhone || ""}</div>
                <div className="text-base text-muted-foreground">{clientCompany || ""}</div>
              </div>

              <div>
                <div className="text-lg font-bold mb-4">Line Items</div>
                <div className="border border-border/40 rounded-lg overflow-hidden">
                  <table className="w-full text-base">
                    <thead className="bg-muted/50">
                      <tr className="border-b border-border/40">
                        <th className="text-left font-semibold p-4">Category</th>
                        <th className="text-left font-semibold p-4">Set</th>
                        <th className="text-left font-semibold p-4">Room</th>
                        <th className="text-left font-semibold p-4">Meters</th>
                        <th className="text-left font-semibold p-4">Rate</th>
                        <th className="text-left font-semibold p-4">Details</th>
                        <th className="text-left font-semibold p-4">Install</th>
                        <th className="text-right font-semibold p-4">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {previewBreakdown.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 capitalize font-medium">{r.category || "—"}</td>
                          <td className="p-4">{r.set}</td>
                          <td className="p-4">{r.room}</td>
                          <td className="p-4">{r.meters}m</td>
                          <td className="p-4">₱{r.rate.toLocaleString()}/m</td>
                          <td className="p-4 text-sm text-muted-foreground max-w-xs">{r.details || "—"}</td>
                          <td className="p-4">{r.installTxt}</td>
                          <td className="p-4 text-right font-semibold">₱{r.totalLine.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 border-border/40">
                      <tr>
                        <td colSpan={7} className="text-right p-4 font-medium">Subtotal</td>
                        <td className="text-right p-4 font-semibold">₱{subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="text-right p-4 font-medium">Tax ({taxRate}%)</td>
                        <td className="text-right p-4 font-semibold">₱{tax.toLocaleString()}</td>
                      </tr>
                      {discount > 0 && (
                        <tr>
                          <td colSpan={7} className="text-right p-4 font-medium text-green-600">Discount</td>
                          <td className="text-right p-4 font-semibold text-green-600">-₱{discount.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-border/40">
                        <td colSpan={7} className="text-right p-4 text-lg font-bold">Total</td>
                        <td className="text-right p-4 text-lg font-bold text-primary">₱{total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/40">
                  This is a proposal document generated for review purposes. Final scope and pricing may vary based on site survey and material selection.
                </div>
                <div className="rounded-lg border border-border/40 p-5 bg-muted/20">
                  <div className="text-sm font-semibold text-muted-foreground mb-3">Project Summary</div>
                  <div className="text-base text-muted-foreground">{notes || "No notes provided."}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {sentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSentOpen(false)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-card border border-border/40 rounded-xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm pb-4 border-b z-10">
              <div>
                <h3 className="text-xl font-bold">Sent Proposals</h3>
                <p className="text-xs text-muted-foreground">Manage your successfully submitted proposals</p>
              </div>
              <button onClick={() => setSentOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  value={sentQuery}
                  onChange={(e) => setSentQuery(e.target.value)}
                  placeholder="Search sent proposals by title, client, or email"
                  className="flex-1 min-w-[200px] p-2 border rounded-md bg-background text-foreground text-sm"
                />
                <select
                  value={sentSortKey}
                  onChange={(e) => { setSentSortKey(e.target.value); setSentPage(1) }}
                  className="p-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="created_desc">Newest</option>
                  <option value="created_asc">Oldest</option>
                  <option value="title_asc">Title</option>
                  <option value="client_asc">Client</option>
                </select>
                <select
                  value={String(pageSize)}
                  onChange={(e) => { const v = Number(e.target.value) || 10; setPageSize(v); setSentPage(1) }}
                  className="p-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              {sentLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading sent proposals...</div>
              ) : (
                <div className="space-y-3">
                  {sentProposals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No sent proposals found.</div>
                  ) : (
                    sentProposals.map((p: any, idx: number) => (
                      <div key={p.id || `sent_${idx}`} className="flex items-center justify-between gap-3 border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{String(p.title || "Untitled Proposal")}</div>
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {String(p?.client?.name || "No client")} • {new Date(p.created_at || Date.now()).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => {
                            setClientName(String(p?.client?.name || ""))
                            setClientEmail(String(p?.client?.email || ""))
                            setClientCompany(String(p?.client?.company || ""))
                            setClientPhone(String(p?.client?.phone || ""))
                            setCrmSelectedId(String(p?.crmId || ""))
                            setTitle(String(p?.title || "Proposal"))
                            setItems((Array.isArray(p?.items) ? p.items : []).map((x: any) => ({
                              id: crypto.randomUUID(),
                              description: String(x?.description || ""),
                              quantity: Number(x?.quantity || 0),
                              unitPrice: Number(x?.unitPrice || 0),
                              details: String(x?.details || ""),
                              category: x?.category,
                              setId: x?.setId,
                              room: x?.room,
                              baseRate: x?.baseRate,
                              tierFactor: x?.tierFactor,
                              materialFactor: x?.materialFactor,
                              finishFactor: x?.finishFactor,
                              hardwareFactor: x?.hardwareFactor,
                              installationAdd: x?.installationAdd
                            })))
                            setTaxRate(Number(p?.taxRate || 0))
                            setDiscount(Number(p?.discount || 0))
                            setNotes(String(p?.notes || ""))
                            setSentOpen(false)
                            toast.success("Sent proposal loaded")
                          }}>Load</Button>
                        </div>
                      </div>
                    ))
                  )}
                  {sentTotal > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">Page {sentPage} of {Math.ceil(sentTotal / pageSize)} • {sentTotal} total sent</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSentPage(Math.max(1, sentPage - 1))} disabled={sentPage <= 1}>Prev</Button>
                        <Button variant="outline" size="sm" onClick={() => setSentPage(Math.min(Math.ceil(sentTotal / pageSize), sentPage + 1))} disabled={sentPage >= Math.ceil(sentTotal / pageSize)}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-card rounded-lg shadow-lg border border-border/40 p-6">
            <div className="text-lg font-semibold text-foreground mb-4">AI Fill from Pricing Versions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <select
                value={selectedVersionTs}
                onChange={(e) => { setSelectedVersionTs(e.target.value); const ver = versions.find((v: any) => String(v.ts) === e.target.value); if (ver) buildPreviewFromVersion(ver) }}
                className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground"
              >
                <option value="">Select a version</option>
                {versions.map((v: any, idx: number) => (
                  <option key={v.ts || `ver_${idx}`} value={String(v.ts)}>{new Date(v.ts).toLocaleString()}</option>
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
                    {aiPreviewBreakdown.map((r, idx) => (
                      <tr key={r.id || `ai_breakdown_${idx}`} className="border-t">
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
              <Button variant="outline" onClick={() => setAiOpen(false)}>Cancel</Button>
              <Button onClick={() => applyAiPrefill()} disabled={!selectedVersionTs}>Apply</Button>
            </div>
          </div>
        </div>
      )}
      <Dialog.Root open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl h-[90vh] rounded-xl border border-border/50 bg-background shadow-xl flex flex-col">
            <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <Dialog.Title className="text-lg font-semibold">Email Preview</Dialog.Title>
              <Dialog.Close asChild>
                <button className="px-2 py-1 rounded-md border">Close</button>
              </Dialog.Close>
            </div>
            <div className="p-4 space-y-3 overflow-auto flex-1">
              <div className="text-xs text-muted-foreground">To: {clientEmail}</div>
              <input
                className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
              />
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-2"><input type="radio" checked={emailFormat === 'text'} onChange={() => { setEmailFormat('text'); setEmailBody(buildEmailText()) }} /> Plain Text</label>
                <label className="flex items-center gap-2"><input type="radio" checked={emailFormat === 'html'} onChange={() => { setEmailFormat('html'); setEmailBody(buildEmailHtml()) }} /> HTML</label>
              </div>
              {emailFormat !== 'html' && (
                <textarea
                  className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground min-h-[220px]"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              )}
              {emailFormat === 'html' && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Live Proposal Preview</div>
                  <div
                    className="rounded-md border border-border/40 bg-white max-h-[40vh] overflow-auto"
                    style={{ whiteSpace: 'normal', wordBreak: 'normal', minWidth: '100%' }}
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2"><input type="checkbox" checked={attachHtml} onChange={(e) => setAttachHtml(e.target.checked)} /> Attach Proposal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={sendToSelf} onChange={(e) => setSendToSelf(e.target.checked)} /> Email to self</label>
              </div>
            </div>
            <div className="p-4 border-t border-border/40 flex items-center justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setEmailPreviewOpen(false)}>Cancel</Button>
              {emailFormat === 'html' && (
                <Button variant="outline" onClick={() => {
                  const html = emailBody || buildEmailHtml()
                  const b64 = safeBase64(html)
                  const url = `data:text/html;base64,${b64}`
                  window.open(url, '_blank')
                }}>Open in new tab</Button>
              )}
              <Button onClick={async () => {
                const dest = (sendToSelf || !clientEmail?.trim()) ? adminEmail : clientEmail
                if (!dest || !dest.trim()) { toast.error("Email config missing"); return }
                try {
                  setSendingEmail(true)
                  const body: any = { to: dest, subject: emailSubject, includeSignature: true }
                  if (emailFormat === 'html') body.html = emailBody
                  else body.text = emailBody
                  try {
                    const htmlForPdf = emailFormat === 'html' ? (emailBody || buildEmailHtml()) : buildEmailHtml()
                    const pres = await fetch('/api/pdf/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: htmlForPdf, format: 'A4' }) })
                    const pjson = await pres.json().catch(() => ({}))
                    if (pres.ok && pjson?.ok && pjson?.pdf_base64) {
                      body.attachments = [...(body.attachments || []), { filename: 'proposal-preview.pdf', content_base64: String(pjson.pdf_base64 || ''), mime: 'application/pdf' }]
                    } else {
                      toast.message('PDF attachment unavailable (conversion failed)')
                    }
                  } catch { }
                  if (attachHtml) {
                    body.attachments = [{ filename: 'proposal-preview.html', content_base64: safeBase64(buildEmailHtml()), mime: 'text/html' }]
                  }
                  const eres = await fetch("/api/gmail/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
                  const ejson = await eres.json().catch(() => ({}))
                  if (eres.ok && ejson?.ok) {
                    toast.success("Preview emailed")
                    try {
                      if (draftId) {
                        await fetch('/api/proposals/drafts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: draftId, patch: { emailed_on: new Date().toISOString() } }) })
                      }
                    } catch { }
                    setEmailPreviewOpen(false)
                  } else {
                    toast.error(String(ejson?.error || "Email failed"))
                  }
                } catch { }
                finally {
                  setSendingEmail(false)
                }
              }} disabled={sendingEmail} aria-busy={sendingEmail}>{sendingEmail ? "Sending…" : "Send Email"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {snippetManagerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSnippetManagerOpen(false); setEditingSnippet(null); }} />
          <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold">Manage Snippets</h3>
              <Button variant="ghost" size="sm" onClick={() => { setSnippetManagerOpen(false); setEditingSnippet(null); }}>
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {snippets.map((s, idx) => (
                <div key={s.id || `snippets_mgr_${idx}`} className="p-3 border rounded-lg group relative hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingSnippet(s)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={async () => {
                        if (!confirm("Delete snippet?")) return
                        await fetch("/api/proposals/snippets", { method: "DELETE", body: JSON.stringify({ id: s.id }) })
                        loadSnippets()
                      }}>Delete</Button>
                    </div>
                  </div>
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap line-clamp-2 bg-muted/30 p-2 rounded">
                    {s.content}
                  </pre>
                </div>
              ))}
              {!editingSnippet && (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setEditingSnippet({ label: "", content: "" })}>
                  <Plus className="w-4 h-4 mr-2" /> Add New Snippet
                </Button>
              )}
            </div>
            {editingSnippet && (
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-bold">{editingSnippet.id ? "Edit Snippet" : "New Snippet"}</div>
                <input
                  className="w-full p-2 border border-border/40 rounded-md bg-background text-sm"
                  placeholder="Label (e.g. Payment Terms)"
                  value={editingSnippet.label}
                  onChange={e => setEditingSnippet({ ...editingSnippet, label: e.target.value })}
                />
                <textarea
                  className="w-full p-2 border border-border/40 rounded-md bg-background text-sm font-mono"
                  rows={4}
                  placeholder="Content..."
                  value={editingSnippet.content}
                  onChange={e => setEditingSnippet({ ...editingSnippet, content: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSnippet(null)}>Cancel</Button>
                  <Button size="sm" onClick={async () => {
                    if (!editingSnippet.label || !editingSnippet.content) return
                    await fetch("/api/proposals/snippets", { method: "POST", body: JSON.stringify(editingSnippet) })
                    setEditingSnippet(null)
                    loadSnippets()
                  }}>Save Snippet</Button>
                </div>
              </div>
            )}
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
      if (e.key === "ArrowLeft") { e.preventDefault(); if (page > 1) setPage(Math.max(1, page - 1)); return }
      if (e.key === "ArrowRight") { e.preventDefault(); if (page < totalPages) setPage(Math.min(totalPages, page + 1)); return }
    }
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("keydown", onKey) }
  }, [page, totalPages])
}
