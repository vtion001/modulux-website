"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import * as Popover from "@radix-ui/react-popover"
import { estimateCabinetCost } from "@/lib/estimator"
import { LazyImage } from "@/components/lazy-image"
import { toast } from "sonner"
import { X, ChevronDown, Trash2, Plus, Calculator, FilePlus, Zap, Settings, CheckCircle2, Info, Users, Printer, Save, RotateCcw, Layout, FolderOpen, Pencil, Download, Upload, ChevronUp } from "lucide-react"

interface CalculatorState {
  projectType: string
  roomSize: string
  cabinetType: string
  material: string
  finish: string
  hardware: string
  installation: boolean
  linearMeter: string
  kitchenScope: string
}

interface Unit {
  enabled: boolean
  category: string
  meters: number
  material: string
  finish: string
  hardware: string
  tier: string
  roomType: string
  customRoomName: string
  setId: number
  items?: string[]
  exclusive?: string[]
  notes?: string
}

export function AdminCalculatorEmbed({ initialData }: { initialData?: any }): JSX.Element {
  const [formData, setFormData] = useState<CalculatorState>(initialData?.prefill?.formData || {
    projectType: "kitchen",
    roomSize: "",
    cabinetType: "luxury",
    material: "",
    finish: "",
    hardware: "",
    installation: false,
    linearMeter: "",
    kitchenScope: "",
  })

  const [estimate, setEstimate] = useState<number | null>(initialData?.prefill?.estimate || null)
  const [subtotal, setSubtotal] = useState<number | null>(initialData?.prefill?.subtotal || null)
  const [tax, setTax] = useState<number | null>(initialData?.prefill?.tax || null)
  const [lines, setLines] = useState<any[]>([])
  const [tierSpecs, setTierSpecs] = useState<Record<string, { items: string[]; exclusive: string[] }>>(initialData?.tierSpecs || {
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
  })
  const [baseRates, setBaseRates] = useState<{ base: number; hanging: number; tall: number } | null>(initialData?.baseRates || null)
  const [tiers, setTiers] = useState<{ luxury: number; premium: number; standard: number } | null>(initialData?.tierMultipliers || null)
  const [cabinetCategory, setCabinetCategory] = useState<string>(initialData?.prefill?.cabinetCategory || "base")
  const [tier, setTier] = useState<string>(initialData?.prefill?.tier || "luxury")
  const [sheetRates, setSheetRates] = useState<any>(initialData?.sheetRates || null)
  const [ctMultipliers, setCtMultipliers] = useState<{ luxury: number; premium: number; basic: number } | null>(initialData?.cabinetTypeMultipliers || null)

  const [units, setUnits] = useState<Unit[]>(initialData?.prefill?.units || [
    { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
    { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
    { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
  ])
  const [roomTypeSelection, setRoomTypeSelection] = useState<string>(initialData?.prefill?.units?.[0]?.roomType || "kitchen")
  const [customRoomName, setCustomRoomName] = useState<string>(initialData?.prefill?.units?.[0]?.customRoomName || "")
  const [applyTax, setApplyTax] = useState(initialData?.prefill?.applyTax ?? true)
  const [taxRate, setTaxRate] = useState(initialData?.prefill?.taxRate ?? 0.12)
  const [discount, setDiscount] = useState(initialData?.prefill?.discount ?? 0)
  const [includeFees, setIncludeFees] = useState(initialData?.prefill?.includeFees ?? true)
  const [importSurcharge, setImportSurcharge] = useState(initialData?.prefill?.importSurcharge ?? false)
  const [downgradeMFC, setDowngradeMFC] = useState(initialData?.prefill?.downgradeMFC ?? false)
  const [configOpen, setConfigOpen] = useState(false)
  const [editor, setEditor] = useState<any>(null)
  const [contactsAll, setContactsAll] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false)
  const [clientQuery, setClientQuery] = useState("")
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [shouldAutoCalc, setShouldAutoCalc] = useState(!!initialData?.prefill)
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)
  const [pricingVersions, setPricingVersions] = useState<any[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const viewTs = searchParams.get("view")

  useEffect(() => {
    (async () => {
      try {
        let cfg = initialData
        if (viewTs) {
          const res = await fetch(`/api/pricing/version/${viewTs}`, { cache: "no-store" })
          if (res.ok) {
            cfg = await res.json()
            toast.info(`Viewing snapshot from ${new Date(Number(viewTs)).toLocaleString()}`)
          }
        }

        if (!cfg && !viewTs) {
          const res = await fetch("/api/pricing/get", { cache: "no-store" })
          cfg = await res.json()
        }

        if (!cfg) return

        if (cfg?.baseRates) setBaseRates(cfg.baseRates)
        if (cfg?.tierMultipliers) setTiers(cfg.tierMultipliers)
        if (cfg?.sheetRates) setSheetRates(cfg.sheetRates)
        else setSheetRates({
          base: { withoutFees: 40476.4, withFees: 51097.4 },
          hanging: { withoutFees: 38452.58, withFees: 48542.53 },
          tall: { withoutFees: 65182.2, withFees: 82286.1 },
        })
        if (cfg?.cabinetTypeMultipliers) setCtMultipliers(cfg.cabinetTypeMultipliers)
        if (cfg?.tierSpecs) setTierSpecs(cfg.tierSpecs)

        // Auto-populate calculator state if prefill data exists
        if (cfg?.prefill) {
          const p = cfg.prefill
          if (p.formData) setFormData(p.formData)
          if (p.units) {
            const normalized = p.units.map((u: any) => ({
              ...u,
              setId: typeof u.setId === 'number' ? u.setId : 0
            }))
            setUnits(normalized)
          }
          if (typeof p.applyTax === 'boolean') setApplyTax(p.applyTax)
          if (typeof p.taxRate === 'number') setTaxRate(p.taxRate)
          if (typeof p.discount === 'number') setDiscount(p.discount)
          if (p.cabinetCategory) setCabinetCategory(p.cabinetCategory)
          if (p.tier) setTier(p.tier)
          if (typeof p.includeFees === 'boolean') setIncludeFees(p.includeFees)
          if (typeof p.importSurcharge === 'boolean') setImportSurcharge(p.importSurcharge)
          if (typeof p.downgradeMFC === 'boolean') setDowngradeMFC(p.downgradeMFC)
        }
        // Trigger a calculation once rates are loaded
        setShouldAutoCalc(true)
      } catch { }
    })()
  }, [initialData])

  useEffect(() => {
    if (!shouldAutoCalc) return
    const hasProject = Boolean(formData.projectType && formData.cabinetType)
    const legacyLm = parseFloat(formData.linearMeter)
    const unitsReady = units.some((u) => u.enabled && Number(u.meters) > 0)
    const ready = hasProject && (unitsReady || (!isNaN(legacyLm) && legacyLm > 0))
    if (ready) {
      calculateEstimate()
      setShouldAutoCalc(false)
    }
  }, [shouldAutoCalc, formData, units, baseRates, tiers, ctMultipliers, sheetRates])

  const loadContacts = async () => {
    setLoadingContacts(true)
    try {
      let merged: any[] = []
      const res = await fetch("/api/crm/contacts", { cache: "no-store" })
      if (res.ok) {
        const db = await res.json().catch(() => ({}))
        const arrC = Array.isArray(db?.contacts) ? db.contacts : []
        const leadsRaw = Array.isArray(db?.leads) ? db.leads : []
        const clientsRaw = Array.isArray(db?.clients) ? db.clients : []
        const arrL = leadsRaw.map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: Array.isArray(l.tags) ? l.tags : ["Lead"], created_at: l.created_at }))
        const arrCli = clientsRaw.map((c: any) => ({ id: c.id, name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", tags: ["Client", c.status || ""].filter(Boolean), created_at: c.created_at }))
        merged = [...arrC, ...arrL, ...arrCli].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
      } else {
        throw new Error("api_failed")
      }
      if (!merged.length) throw new Error("empty")
      setContactsAll(merged)
      setContacts(merged)
      toast.success(`Loaded ${merged.length} contacts`)
    } catch {
      try {
        const res2 = await fetch("/data/crm.json", { cache: "no-store" })
        const db2 = await res2.json().catch(() => ({}))
        const arrC2 = Array.isArray(db2?.contacts) ? db2.contacts : []
        const leadsRaw2 = Array.isArray(db2?.leads) ? db2.leads : []
        const arrL2 = leadsRaw2.map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: ["Lead", l.status || ""].filter(Boolean), created_at: l.created_at }))
        const merged2 = [...arrC2, ...arrL2]
        setContactsAll(merged2)
        setContacts(merged2)
        toast.success(`Loaded ${merged2.length} contacts (local)`)
      } catch {
        toast.error("Failed to load contacts. Please check CRM configuration.")
      }
    } finally {
      setLoadingContacts(false)
    }
  }
  useEffect(() => { loadContacts() }, [])
  useEffect(() => { if (isClientPickerOpen) loadContacts() }, [isClientPickerOpen])

  const loadVersions = async () => {
    setLoadingVersions(true)
    try {
      const res = await fetch("/api/pricing/versions", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setPricingVersions(data.versions || [])
        if (data.versions?.length > 0) {
          setLastUpdate(new Date(data.versions[0].ts).toLocaleString())
        }
      }
    } catch { } finally {
      setLoadingVersions(false)
    }
  }
  useEffect(() => { loadVersions() }, [])

  useEffect(() => {
    const rt = units[0]?.roomType
    const cn = units[0]?.customRoomName
    if (typeof rt === "string") setRoomTypeSelection(rt)
    if (typeof cn === "string") setCustomRoomName(cn)
  }, [units])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      cabinetType: tier === "standard" ? "basic" : tier,
    }))
  }, [tier])

  useEffect(() => {
    if (configOpen) {
      setEditor({
        baseRates: baseRates || { base: 0, hanging: 0, tall: 0 },
        tierMultipliers: tiers || { luxury: 1, premium: 0.9, standard: 0.8 },
        sheetRates: sheetRates || {
          base: { withoutFees: 40476.4, withFees: 51097.4 },
          hanging: { withoutFees: 38452.58, withFees: 48542.53 },
          tall: { withoutFees: 65182.2, withFees: 82286.1 },
        },
        cabinetTypeMultipliers: ctMultipliers || { luxury: 1, premium: 0.9, basic: 0.8 },
        tierSpecs: tierSpecs,
      })
    }
  }, [configOpen])

  const savePricingConfig = async () => {
    try {
      const res = await fetch("/api/pricing/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editor),
      })
      const json = await res.json()
      if (!json.ok) throw new Error("save failed")
      setBaseRates(json.data.baseRates)
      setTiers(json.data.tierMultipliers)
      setSheetRates(json.data.sheetRates)
      setCtMultipliers(json.data.cabinetTypeMultipliers)
      setConfigOpen(false)
      toast.success("Pricing updated")
    } catch {
      toast.error("Failed to update pricing")
    }
  }

  const calculateEstimate = () => {
    try {
      if (!formData.projectType || !formData.cabinetType) return
      const activeUnits = units
        .filter((u) => u.enabled && Number(u.meters) > 0)
        .map((u) => ({
          category: u.category,
          meters: Number(u.meters),
          material: u.material || undefined,
          finish: u.finish || undefined,
          hardware: u.hardware || undefined,
          tier: u.tier || tier,
          items: u.items,
          exclusive: u.exclusive,
        }))
      const legacyLm = parseFloat(formData.linearMeter)
      const useLegacy = !activeUnits.length && !isNaN(legacyLm) && legacyLm > 0
      if (!useLegacy && activeUnits.length === 0) {
        toast.error("Please enter linear meters or per-unit meters before calculating.")
        return
      }
      const res = estimateCabinetCost({
        projectType: formData.projectType,
        cabinetType: formData.cabinetType,
        linearMeter: useLegacy ? legacyLm : undefined,
        installation: formData.installation,
        cabinetCategory,
        tier,
        baseRates: baseRates || undefined,
        tierMultipliers: tiers || undefined,
        cabinetTypeMultipliers: ctMultipliers || undefined,
        units: activeUnits,
        discount,
        applyTax,
        taxRate,
        sheetRates: sheetRates || undefined,
        includeFees,
        applyImportSurcharge: importSurcharge,
        downgradeToMFC: downgradeMFC,
      })
      setEstimate(res.total)
      setSubtotal(res.breakdown?.subtotal ?? null)
      setTax(res.breakdown?.tax ?? null)
      setLines(res.breakdown?.units || [])
    } catch {
      toast.error("Invalid inputs. Please check your configuration.")
    }
  }

  const handleInputChange = (field: keyof CalculatorState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const recordVersion = async () => {
    try {
      // Ensure we save a perfectly synchronized snapshot by running the estimator logic here
      const activeUnits = units
        .filter((u) => u.enabled && Number(u.meters) > 0)
        .map((u) => ({
          category: u.category,
          meters: Number(u.meters),
          material: u.material || undefined,
          finish: u.finish || undefined,
          hardware: u.hardware || undefined,
          tier: u.tier || tier,
          items: u.items,
          exclusive: u.exclusive,
        }))
      const legacyLm = parseFloat(formData.linearMeter)
      const useLegacy = !activeUnits.length && !isNaN(legacyLm) && legacyLm > 0

      const calcResult = estimateCabinetCost({
        projectType: formData.projectType,
        cabinetType: formData.cabinetType,
        linearMeter: useLegacy ? legacyLm : undefined,
        installation: formData.installation,
        cabinetCategory,
        tier,
        baseRates: baseRates || undefined,
        tierMultipliers: tiers || undefined,
        cabinetTypeMultipliers: ctMultipliers || undefined,
        units: activeUnits,
        discount,
        applyTax,
        taxRate,
        sheetRates: sheetRates || undefined,
        includeFees,
        applyImportSurcharge: importSurcharge,
        downgradeToMFC: downgradeMFC,
      })

      const payload = {
        baseRates,
        tierMultipliers: tiers,
        sheetRates,
        cabinetTypeMultipliers: ctMultipliers,
        prefill: {
          formData,
          units,
          applyTax,
          taxRate,
          discount,
          cabinetCategory,
          tier,
          includeFees,
          importSurcharge,
          downgradeMFC,
          estimate: calcResult.total,
          subtotal: calcResult.breakdown?.subtotal || 0,
          tax: calcResult.breakdown?.tax || 0
        }
      }
      const res = await fetch("/api/pricing/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success("Pricing version recorded")
        window.location.reload()
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Failed to record version")
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFB] py-6 space-y-8">
      <div className="max-w-[1600px] mx-auto px-6 space-y-6">
        {/* New Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 transition-all group" title="View Saved Projects" onClick={() => toast.info("Project history coming soon")}>
                <FolderOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => {
                  setFormData({
                    projectType: "kitchen", roomSize: "", cabinetType: "luxury", material: "", finish: "", hardware: "", installation: false, linearMeter: "", kitchenScope: "",
                  })
                  setUnits([
                    { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                    { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                    { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                  ])
                  toast.success("New project started")
                }}
                className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 transition-all group" title="New Project"
              >
                <Plus className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900">
                {formData.projectType ? formData.projectType.charAt(0).toUpperCase() + formData.projectType.slice(1) : "New"} Project
                <button className="opacity-30 hover:opacity-100 transition-opacity" title="Edit Name">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfigOpen(true)}
                  className="opacity-30 hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg" title="Project Settings & Client Details">
                  <Settings className="w-5 h-5" />
                </button>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Estimation Suite</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1.5 bg-slate-50 border border-slate-100 rounded-xl mr-2">
              <button className="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 uppercase bg-primary text-primary-foreground shadow-sm">mm</button>
              <button className="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 uppercase text-slate-400 hover:text-slate-700 hover:bg-white">cm</button>
              <button className="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 uppercase text-slate-400 hover:text-slate-700 hover:bg-white">m</button>
            </div>

            <button
              onClick={() => {
                setFormData({
                  projectType: "kitchen", roomSize: "", cabinetType: "luxury", material: "", finish: "", hardware: "", installation: false, linearMeter: "", kitchenScope: "",
                })
                setUnits(initialData?.prefill?.units || [
                  { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                  { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                  { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                ])
                setEstimate(null)
                setSubtotal(null)
                setTax(null)
                setLines([])
                toast.info("Calculator reset")
              }}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            <button
              onClick={() => { localStorage.setItem("calculator_config", JSON.stringify({ formData, units, applyTax, taxRate, discount, cabinetCategory, tier, includeFees, importSurcharge, downgradeMFC })); toast.success("Draft saved successfully") }}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>

            <button
              onClick={calculateEstimate}
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all md:hover:-translate-y-0.5 shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] gap-2"
            >
              <Calculator className="w-4 h-4" /> Calculate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Operational Summary */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Operational Summary</h2>
              </div>
              <ul className="text-[12px] font-bold text-slate-500 space-y-3">
                <li className="flex gap-3 items-start p-3 rounded-xl bg-[#FAFBFB] border border-slate-50">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <span>Estimates based on current ModuLux market rates.</span>
                </li>
                <li className="flex gap-3 items-start p-3 rounded-xl bg-[#FAFBFB] border border-slate-50">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span>Linear meter calcs are approximate prior to final site survey.</span>
                </li>
              </ul>
            </div>

            {/* 2. Project Details Card */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-50">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Project Details
                </h2>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => {
                      setFormData({
                        projectType: "kitchen",
                        roomSize: "",
                        cabinetType: "luxury",
                        material: "",
                        finish: "",
                        hardware: "",
                        installation: false,
                        linearMeter: "",
                        kitchenScope: "",
                      })
                      setUnits([
                        { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                        { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                        { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType: "kitchen", customRoomName: "", setId: 0 },
                      ])
                      setRoomTypeSelection("kitchen")
                      setCustomRoomName("")
                      setCabinetCategory("base")
                      setTier("luxury")
                      setApplyTax(true)
                      setTaxRate(0.12)
                      setDiscount(0)
                      setIncludeFees(true)
                      setImportSurcharge(false)
                      setDowngradeMFC(false)
                      setEstimate(null)
                      setSubtotal(null)
                      setTax(null)
                      setLines([])
                      toast.success("Calculator cleared")
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Project Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["kitchen", "bathroom", "bedroom", "office"].map((value) => (
                      <button type="button" key={value} onClick={() => handleInputChange("projectType", value)}
                        className={`py-3 px-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all transform active:scale-95 ${formData.projectType === value ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary" : "bg-[#FAFBFB] text-slate-400 border border-slate-100 hover:border-slate-200"}`}>
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Quality Tier</label>
                      <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full bg-[#FAFBFB] border border-slate-100 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10">
                        <option value="luxury">Luxury Elite</option>
                        <option value="premium">Premium Selected</option>
                        <option value="standard">Standard Quality</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFBFB] border border-slate-50 cursor-pointer hover:border-slate-200 transition-all">
                      <input type="checkbox" checked={includeFees} onChange={(e) => setIncludeFees(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">VAT & Legal Fees</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFBFB] border border-slate-50 cursor-pointer hover:border-slate-200 transition-all">
                      <input type="checkbox" checked={importSurcharge} onChange={(e) => setImportSurcharge(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">10% Import Surcharge</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFBFB] border border-slate-50 cursor-pointer hover:border-slate-200 transition-all">
                      <input type="checkbox" checked={downgradeMFC} onChange={(e) => setDowngradeMFC(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">MFC Downgrade (-10%)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="pt-6 border-t border-slate-50">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800 flex items-center gap-2">
                          <Layout className="w-4 h-4 text-primary" />
                          Cabinet Configuration
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define units and dimensions</p>
                      </div>
                      <button type="button"
                        onClick={() => {
                          const roomType = roomTypeSelection || "kitchen"
                          const customRoomNameLocal = customRoomName || ""
                          const maxSid = Math.max(-1, ...units.map((u: any) => typeof u.setId === 'number' ? u.setId : -1))
                          const nextSid = maxSid + 1
                          setUnits(prev => [
                            ...prev,
                            { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType, customRoomName: customRoomNameLocal, setId: nextSid },
                            { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType, customRoomName: customRoomNameLocal, setId: nextSid },
                            { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "", roomType, customRoomName: customRoomNameLocal, setId: nextSid },
                          ])
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        Add Unit Set
                      </button>
                    </div>

                    <div className="space-y-6">
                      {Array.from(new Set(units.map(u => typeof (u as any).setId === "number" ? (u as any).setId : 0))).sort((a, b) => a - b).map((sid) => {
                        const group = units.filter(x => (typeof (x as any).setId === "number" ? (x as any).setId : 0) === sid)
                        const first: any = group[0] || {}
                        const rt = first.roomType || "kitchen"
                        const cn = first.customRoomName || ""
                        return (
                          <div key={`set-${sid}`} className="bg-[#FAFBFB] rounded-[24px] p-6 border border-slate-100 shadow-sm relative group/set">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[12px] font-black text-slate-900 shadow-sm">
                                  {sid + 1}
                                </span>
                                <div>
                                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Unit Set</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Location: {rt === 'custom' ? (cn || 'Custom') : rt[0].toUpperCase() + rt.slice(1)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={rt}
                                  onChange={(e) => {
                                    const newRoom = e.target.value
                                    setUnits(prev => prev.map(u => ((typeof (u as any).setId === 'number' ? (u as any).setId : 0) === sid) ? { ...u, roomType: newRoom, customRoomName: newRoom === 'custom' ? cn : '' } : u))
                                  }}
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                >
                                  <option value="kitchen">Kitchen</option>
                                  <option value="bathroom">Bathroom</option>
                                  <option value="bedroom">Bedroom</option>
                                  <option value="office">Office</option>
                                  <option value="custom">Custom</option>
                                </select>
                                <button type="button"
                                  onClick={() => setUnits(prev => prev.filter(x => (typeof (x as any).setId === 'number' ? (x as any).setId : 0) !== sid))}
                                  className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {rt === 'custom' && (
                              <div className="mb-6">
                                <input
                                  type="text"
                                  placeholder="Enter custom room name..."
                                  value={cn}
                                  onChange={(e) => {
                                    const name = e.target.value
                                    setUnits(prev => prev.map(u => ((typeof (u as any).setId === 'number' ? (u as any).setId : 0) === sid) ? { ...u, customRoomName: name } : u))
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {group.map((u: any, i: number) => {
                                const unitId = `${sid}-${u.category}-${i}`;
                                const isExpanded = expandedUnitId === unitId;
                                return (
                                  <div key={unitId} className={`rounded-2xl p-4 border transition-all ${u.enabled ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-transparent opacity-60"}`}>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${u.enabled ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{u.category}</span>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(u.enabled)}
                                        onChange={(e) => setUnits(prev => {
                                          let count = -1
                                          return prev.map(x => {
                                            const sidX = typeof (x as any).setId === 'number' ? (x as any).setId : 0
                                            if (sidX === sid) {
                                              count++
                                              if (count === i) return { ...x, enabled: e.target.checked, meters: e.target.checked ? x.meters : 0 }
                                            }
                                            return x
                                          })
                                        })}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                      />
                                    </div>

                                    <div className="space-y-4">
                                      <div className="relative">
                                        <input
                                          type="number"
                                          placeholder="Meters"
                                          value={u.meters || ""}
                                          onChange={(e) => setUnits(prev => {
                                            let count = -1
                                            const val = parseFloat(e.target.value) || 0
                                            return prev.map(x => {
                                              const sidX = typeof (x as any).setId === 'number' ? (x as any).setId : 0
                                              if (sidX === sid) {
                                                count++
                                                if (count === i) return { ...x, meters: val }
                                              }
                                              return x
                                            })
                                          })}
                                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[12px] font-black text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/10"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">LM</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setExpandedUnitId(isExpanded ? null : unitId)}
                                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? "bg-slate-900 text-white" : "bg-primary/5 text-primary hover:bg-primary/10"}`}
                                      >
                                        <Settings className="w-3 h-3" />
                                        {isExpanded ? "Hide Details" : "Configure"}
                                      </button>

                                      {isExpanded && (
                                        <div className="space-y-3 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                          <select
                                            value={u.material}
                                            onChange={(e) => setUnits(prev => {
                                              let count = -1; const val = e.target.value; return prev.map(x => { const sidX = typeof (x as any).setId === 'number' ? (x as any).setId : 0; if (sidX === sid) { count++; if (count === i) return { ...x, material: val } } return x })
                                            })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                          >
                                            <option value="">Material</option>
                                            <option value="melamine">Melamine</option>
                                            <option value="laminate">Laminate</option>
                                            <option value="wood">Solid Wood</option>
                                            <option value="premium">Premium Wood</option>
                                          </select>
                                          <select
                                            value={u.finish}
                                            onChange={(e) => setUnits(prev => {
                                              let count = -1; const val = e.target.value; return prev.map(x => { const sidX = typeof (x as any).setId === 'number' ? (x as any).setId : 0; if (sidX === sid) { count++; if (count === i) return { ...x, finish: val } } return x })
                                            })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                          >
                                            <option value="">Finish</option>
                                            <option value="standard">Standard</option>
                                            <option value="painted">Painted</option>
                                            <option value="stained">Stained</option>
                                            <option value="lacquer">Lacquer</option>
                                          </select>
                                          <select
                                            value={u.hardware}
                                            onChange={(e) => setUnits(prev => {
                                              let count = -1; const val = e.target.value; return prev.map(x => { const sidX = typeof (x as any).setId === 'number' ? (x as any).setId : 0; if (sidX === sid) { count++; if (count === i) return { ...x, hardware: val } } return x })
                                            })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                          >
                                            <option value="">Hardware</option>
                                            <option value="basic">Basic</option>
                                            <option value="soft_close">Soft-close</option>
                                            <option value="premium">Premium</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Adjustments & Tax</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <input type="number" min="0" max="1" step="0.01" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#FAFBFB] border border-slate-100 rounded-2xl px-4 py-3 text-[13px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Discount</span>
                          </div>
                          <div className="relative group text-slate-400">
                            <input type="number" min="0" max="1" step="0.01" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#FAFBFB] border border-slate-100 rounded-2xl px-4 py-3 text-[13px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Tax Rate</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${applyTax ? 'bg-primary' : 'bg-slate-200'}`} onClick={() => setApplyTax(!applyTax)}>
                              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition duration-200 ease-in-out ${applyTax ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <input type="checkbox" className="hidden" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">Apply Tax</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.installation ? 'bg-primary' : 'bg-slate-200'}`} onClick={() => handleInputChange("installation", !formData.installation)}>
                              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition duration-200 ease-in-out ${formData.installation ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.installation} onChange={(e) => handleInputChange("installation", e.target.checked)} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">Installation</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col justify-end">
                        <button type="button" onClick={calculateEstimate}
                          className="w-full h-[52px] bg-primary text-white rounded-[20px] font-black uppercase tracking-[0.2em] text-[13px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group">
                          <Zap className="w-4 h-4 group-hover:animate-pulse" />
                          Calculate Estimate
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-50">
                      <button type="button" onClick={() => { localStorage.setItem("calculator_config", JSON.stringify({ formData, units, applyTax, taxRate, discount, cabinetCategory, tier, includeFees, importSurcharge, downgradeMFC })); toast.success("Configuration saved") }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <Save className="w-3.5 h-3.5" />
                        Save Draft
                      </button>
                      <button type="button" onClick={() => { try { const raw = localStorage.getItem("calculator_config"); if (!raw) { toast.error("No saved config"); return } const cfg = JSON.parse(raw); setFormData(cfg.formData); const loadedUnits = Array.isArray(cfg.units) ? cfg.units : []; const normalized = loadedUnits.map((u: any, idx: number) => ({ ...u, setId: typeof u.setId === 'number' ? u.setId : 0 })); setUnits(normalized); setApplyTax(cfg.applyTax); setTaxRate(cfg.taxRate); setDiscount(cfg.discount); setCabinetCategory(cfg.cabinetCategory); setTier(cfg.tier); setIncludeFees(Boolean(cfg.includeFees)); setImportSurcharge(Boolean(cfg.importSurcharge)); setDowngradeMFC(Boolean(cfg.downgradeMFC)); const firstUnit = normalized.length ? normalized[0] : {}; setRoomTypeSelection(String((firstUnit as any).roomType || "kitchen")); setCustomRoomName(String((firstUnit as any).customRoomName || "")); toast.success("Configuration loaded") } catch { toast.error("Failed to load config") } }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Load Last
                      </button>
                      <button type="button" onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <Printer className="w-3.5 h-3.5" />
                        Print PDF
                      </button>
                      <button type="button" onClick={() => setConfigOpen(true)}
                        className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        <Settings className="w-3.5 h-3.5" />
                        Global Pricing
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {estimate && (
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.02)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-50">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FilePlus className="w-5 h-5 text-primary" />
                        Detailed Cost Breakdown
                      </h2>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">Itemized units and multiplier analysis</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-[#FAFBFB]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Unit / Room</th>
                          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Meters</th>
                          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Base Rate</th>
                          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Factors</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {lines.map((row, idx) => {
                          const metaList = units.filter((u: any) => u.enabled && Number(u.meters) > 0)
                          const meta = metaList[idx] || {}
                          const rt = (meta as any).roomType as string | undefined
                          const cn = (meta as any).customRoomName as string | undefined
                          const roomLabel = rt === 'custom' ? (cn || 'Custom') : (rt ? rt[0].toUpperCase() + rt.slice(1) : '')
                          return (
                            <tr key={idx} className="hover:bg-white transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-black text-slate-900 capitalize">{row.category} Units</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{roomLabel}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-[13px] font-black text-slate-900">{row.meters}m</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-[12px] font-bold text-slate-500">₱{Number(row.baseRate || 0).toLocaleString()}</span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-black text-slate-400">×{row.tierFactor}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-black text-slate-400">×{row.materialFactor}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-[14px] font-black text-primary">₱{Number(row.lineTotal || 0).toLocaleString()}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900 rounded-[32px] text-white">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-primary" />
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Included Specification</h4>
                      </div>
                      <ul className="grid grid-cols-1 gap-2">
                        {(tierSpecs[tier]?.items || []).slice(0, 4).map((it, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] font-medium text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-end items-end space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Model</span>
                      <span className="text-2xl font-black text-primary tracking-tight">{tier[0].toUpperCase() + tier.slice(1)} Elite</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50">
              <div className="text-center mb-10">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Estimated Total</span>
                <div className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                  ₱{estimate ? Math.round(estimate).toLocaleString() : "0"}
                </div>
                <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full w-fit mx-auto border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pricing Calculated</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 max-w-md mx-auto">
                <div className="flex items-center justify-between p-5 bg-[#FAFBFB] rounded-2xl border border-slate-50">
                  <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight">Subtotal</span>
                  <span className="text-lg font-black text-slate-900">₱{Math.round(subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-[#FAFBFB] rounded-2xl border border-slate-50">
                  <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight">Tax ({Math.round(taxRate * 100)}%)</span>
                  <span className="text-lg font-black text-slate-900">₱{Math.round(tax || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 max-w-md mx-auto space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 px-1">Assign to Client</label>
                  <Popover.Root open={isClientPickerOpen} onOpenChange={setIsClientPickerOpen}>
                    <Popover.Trigger asChild>
                      <button type="button" className="w-full flex items-center justify-between px-6 py-4 bg-[#FAFBFB] hover:bg-white border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-700 transition-all shadow-sm group">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                          <span>{selectedClient ? selectedClient.name : "Select Reference Client"}</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-slate-300" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Content sideOffset={8} className="w-[320px] bg-white border border-slate-100 rounded-[28px] shadow-2xl p-4 z-50">
                      <div className="bg-slate-50 p-3 rounded-2xl mb-4">
                        <input value={clientQuery} onChange={(e) => { const q = e.target.value.toLowerCase(); setClientQuery(e.target.value); setContacts(contactsAll.filter(c => String(c.name).toLowerCase().includes(q))) }}
                          placeholder="Search clients..." className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-bold" />
                      </div>
                      <div className="max-h-60 overflow-auto space-y-1">
                        {contacts.map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setIsClientPickerOpen(false) }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedClient?.id === c.id ? "bg-primary text-white" : "hover:bg-slate-50"}`}>
                            <div className="text-[13px] font-black">{c.name}</div>
                          </button>
                        ))}
                      </div>
                    </Popover.Content>
                  </Popover.Root>
                </div>
                <button type="button"
                  disabled={!selectedClient || !estimate}
                  onClick={async () => {
                    if (!selectedClient || !estimate) return
                    const items = (lines || []).map((u: any, idx: number) => {
                      const metaList = units.filter((uu: any) => uu.enabled && Number(uu.meters) > 0)
                      const meta: any = metaList[idx] || {}
                      const sid = typeof meta.setId === 'number' ? meta.setId : undefined
                      const setLabel = typeof sid === 'number' ? `Set ${sid + 1}` : ''
                      const rt = String(meta.roomType || '')
                      const roomLabel = rt === 'custom' ? String(meta.customRoomName || 'Custom') : (rt ? rt[0].toUpperCase() + rt.slice(1) : '')
                      const details = [
                        setLabel,
                        roomLabel ? `Room: ${roomLabel}` : null,
                        `Tier: ${u.tier || tier}`,
                        `Meters: ${u.meters}`,
                        `Factors: ×${u.tierFactor} ×${u.materialFactor}`,
                        Number(u.installationAdd || 0) ? `Install: ₱${Number(u.installationAdd || 0).toLocaleString()}` : null,
                      ].filter(Boolean).join(' • ')
                      return {
                        description: `${u.category} cabinets (${formData.cabinetType})`,
                        quantity: Number(u.meters || 0),
                        unitPrice: Math.round(Number(u.lineTotal || 0) / Math.max(1, Number(u.meters || 1))),
                        details,
                      }
                    })
                    const payload = {
                      client: { name: selectedClient.name || "", email: selectedClient.email || "", company: selectedClient.company || "" },
                      title: `${formData.projectType || "Project"} Proposal`,
                      items,
                      taxRate: applyTax ? taxRate * 100 : 0,
                      discount: Math.round((discount || 0) * (subtotal || 0)),
                      notes: "Generated from ModuLux Estimator",
                      calculatorSnapshot: { formData, units, applyTax, taxRate, discount, cabinetCategory, tier, includeFees, importSurcharge, downgradeMFC },
                    }
                    try {
                      const res = await fetch("/api/proposals/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                      const data = await res.json()
                      if (data?.id) window.location.href = `/admin/proposals?id=${encodeURIComponent(data.id)}`
                    } catch { toast.error("Failed to generate quote") }
                  }}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[14px] transition-all flex items-center justify-center gap-3 ${selectedClient ? "bg-slate-900 text-white shadow-2xl shadow-slate-200 hover:scale-[1.02]" : "bg-slate-100 text-slate-300 pointer-events-none"}`}>
                  <Calculator className="w-5 h-5" />
                  Request Quote
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                    <Zap className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Active Pricing
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current market rates</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-[11px]">
                <div className="bg-[#FAFBFB] p-5 rounded-2xl border border-slate-50">
                  <div className="font-black text-slate-900 mb-3 uppercase tracking-tighter text-[10px]">Base Rates</div>
                  <div className="space-y-1.5 font-bold text-slate-500">
                    <div className="flex justify-between"><span>Base:</span> <span className="text-slate-900">₱{baseRates?.base || "-"}</span></div>
                    <div className="flex justify-between"><span>Hanging:</span> <span className="text-slate-900">₱{baseRates?.hanging || "-"}</span></div>
                    <div className="flex justify-between"><span>Tall:</span> <span className="text-slate-900">₱{baseRates?.tall || "-"}</span></div>
                  </div>
                </div>
                <div className="bg-[#FAFBFB] p-5 rounded-2xl border border-slate-50">
                  <div className="font-black text-slate-900 mb-3 uppercase tracking-tighter text-[10px]">Tier Factors</div>
                  <div className="space-y-1.5 font-bold text-slate-500">
                    <div className="flex justify-between"><span>Luxury:</span> <span className="text-slate-900">×{tiers?.luxury || "-"}</span></div>
                    <div className="flex justify-between"><span>Premium:</span> <span className="text-slate-900">×{tiers?.premium || "-"}</span></div>
                    <div className="flex justify-between"><span>Standard:</span> <span className="text-slate-900">×{tiers?.standard || "-"}</span></div>
                  </div>
                </div>
                <div className="bg-[#FAFBFB] p-5 rounded-2xl border border-slate-50">
                  <div className="font-black text-slate-900 mb-3 uppercase tracking-tighter text-[10px]">Type Factors</div>
                  <div className="space-y-1.5 font-bold text-slate-500">
                    <div className="flex justify-between"><span>Luxury:</span> <span className="text-slate-900">×{ctMultipliers?.luxury || "-"}</span></div>
                    <div className="flex justify-between"><span>Premium:</span> <span className="text-slate-900">×{ctMultipliers?.premium || "-"}</span></div>
                    <div className="flex justify-between"><span>Basic:</span> <span className="text-slate-900">×{ctMultipliers?.basic || "-"}</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Updated {lastUpdate || "Real-time"}</span>
                <button onClick={() => setConfigOpen(true)} className="text-[10px] font-black text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest transition-all">
                  <Settings className="w-3.5 h-3.5" />
                  Adjust
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                    <RotateCcw className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Pricing Versions
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Snapshot history</p>
                </div>
                <button className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all border border-rose-100">Clear</button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                {pricingVersions.map((v) => (
                  <div key={v.ts} className="group p-4 bg-[#FAFBFB] rounded-2xl border border-slate-50 hover:border-slate-200 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{new Date(v.ts).toLocaleString()}</div>
                      <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">₱{Math.round(v.data?.prefill?.estimate || 0).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                      <a href={`?view=${v.ts}`} className="px-3 py-1.5 rounded-lg border border-slate-100 bg-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">View</a>
                      <button onClick={async () => { if (confirm("Restore this version?")) { window.location.href = `/api/pricing/restore?ts=${v.ts}` } }} className="px-3 py-1.5 rounded-lg border border-slate-100 bg-white text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-colors">Restore</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div >
        </div >
        {
          configOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                      Pricing Configuration
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Master rates and global multipliers</p>
                  </div>
                  <button onClick={() => setConfigOpen(false)} className="p-2 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {editor && (
                  <div className="p-8 space-y-8 max-h-[70vh] overflow-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['base', 'hanging', 'tall'].map((cat) => (
                        <div key={cat}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Base Rate ({cat})</label>
                          <input type="number" value={(editor.baseRates as any)[cat]} onChange={(e) => setEditor({ ...editor, baseRates: { ...editor.baseRates, [cat]: Number(e.target.value) || 0 } })} className="w-full bg-[#FAFBFB] border border-slate-100 rounded-xl px-4 py-3 text-[13px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Tier Multipliers
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['luxury', 'premium', 'standard'].map((t) => (
                          <div key={t}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{t}</label>
                            <input type="number" step="0.01" value={(editor.tierMultipliers as any)[t]} onChange={(e) => setEditor({ ...editor, tierMultipliers: { ...editor.tierMultipliers, [t]: Number(e.target.value) || 1 } })} className="w-full bg-[#FAFBFB] border border-slate-100 rounded-xl px-4 py-3 text-[13px] font-black text-slate-700" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setConfigOpen(false)} className="px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                  <button type="button" onClick={() => { savePricingConfig(); setConfigOpen(false); }} className="px-8 py-3 bg-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  )
}
