"use client"

import { useEffect, useState } from "react"
import { estimateCabinetCost } from "@/lib/estimator"
import { LazyImage } from "@/components/lazy-image"
import { toast } from "sonner"

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

const pricing = {
  projectType: {
    kitchen: 1.0,
    bathroom: 0.8,
    bedroom: 0.9,
    office: 0.7,
  },
  roomSize: {
    small: 50000,
    medium: 100000,
    large: 200000,
    xlarge: 350000,
  },
  cabinetType: {
    basic: 1.0,
    premium: 1.5,
    luxury: 2.0,
  },
  material: {
    melamine: 1.0,
    laminate: 1.2,
    wood: 1.8,
    premium: 2.5,
  },
  finish: {
    standard: 1.0,
    painted: 1.3,
    stained: 1.4,
    lacquer: 1.6,
  },
  hardware: {
    basic: 1.0,
    soft_close: 1.2,
    premium: 1.5,
  },
  installation: 0.3,
}

export default function CalculatorPage() {
  const [formData, setFormData] = useState<CalculatorState>({
    projectType: "",
    roomSize: "",
    cabinetType: "",
    material: "",
    finish: "",
    hardware: "",
    installation: false,
    linearMeter: "",
    kitchenScope: "",
  })

  const [estimate, setEstimate] = useState<number | null>(null)
  const [subtotal, setSubtotal] = useState<number | null>(null)
  const [tax, setTax] = useState<number | null>(null)
  const [baseRates, setBaseRates] = useState<{ base: number; hanging: number; tall: number } | null>(null)
  const [tiers, setTiers] = useState<{ luxury: number; premium: number; standard: number } | null>(null)
  const [cabinetCategory, setCabinetCategory] = useState<string>("base")
  const [tier, setTier] = useState<string>("luxury")

  const [units, setUnits] = useState([
    { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "" },
    { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "" },
    { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "" },
  ])
  const [applyTax, setApplyTax] = useState(true)
  const [taxRate, setTaxRate] = useState(0.12)
  const [discount, setDiscount] = useState(0)
  const [contactsAll, setContactsAll] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/data/calculator-pricing.json")
        const cfg = await res.json()
        if (cfg?.baseRates) setBaseRates(cfg.baseRates)
        if (cfg?.tierMultipliers) setTiers(cfg.tierMultipliers)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/data/crm.json")
        const db = await res.json().catch(() => ({}))
        const arr = Array.isArray(db?.contacts) ? db.contacts : []
        setContactsAll(arr)
        setContacts(arr)
      } catch {}
    })()
  }, [])

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
        }))
      const legacyLm = parseFloat(formData.linearMeter)
      const useLegacy = !activeUnits.length && !isNaN(legacyLm) && legacyLm > 0
      const res = estimateCabinetCost({
        projectType: formData.projectType,
        cabinetType: formData.cabinetType,
        linearMeter: useLegacy ? legacyLm : undefined,
        installation: formData.installation,
        cabinetCategory,
        tier,
        baseRates: baseRates || undefined,
        tierMultipliers: tiers || undefined,
        units: activeUnits,
        discount,
        applyTax,
        taxRate,
      })
      setEstimate(res.total)
      setSubtotal(res.breakdown?.subtotal ?? null)
      setTax(res.breakdown?.tax ?? null)
    } catch (e) {
      toast.error("Invalid inputs. Please check your configuration.")
    }
  }

  const handleInputChange = (field: keyof CalculatorState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Project Cost Calculator</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get an instant estimate for your modular cabinet project. This calculator provides approximate pricing based
            on your specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Project Details</h2>

            <div className="space-y-6">
              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Project Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "kitchen", label: "Kitchen" },
                    { value: "bathroom", label: "Bathroom" },
                    { value: "bedroom", label: "Bedroom" },
                    { value: "office", label: "Office" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange("projectType", option.value)}
                      className={`p-3 rounded-md border text-sm font-medium transition-all duration-200 ${
                        formData.projectType === option.value
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border/40 text-foreground hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Cabinet Type</label>
                    <select value={cabinetCategory} onChange={(e) => setCabinetCategory(e.target.value)} className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="base">Base Cabinet</option>
                      <option value="hanging">Hanging Cabinet</option>
                      <option value="tall">Tall Units</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Quality Tier</label>
                    <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="luxury">Luxury</option>
                      <option value="premium">Premium</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
                </div>
                {formData.projectType === "kitchen" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Kitchen Cabinet Scope</label>
                    <select
                      value={formData.kitchenScope}
                      onChange={(e) => handleInputChange("kitchenScope", e.target.value)}
                      className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Scope</option>
                      <option value="base_only">Base Cabinets Only</option>
                      <option value="hanging_only">Hanging Cabinets Only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Unit Selections */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Cabinet Units</label>
                <div className="space-y-3">
                  {units.map((u, i) => (
                    <div key={u.category} className="border border-border/40 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium capitalize">{u.category} units</div>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={u.enabled} onChange={(e) => setUnits(prev => prev.map((x, idx) => idx === i ? { ...x, enabled: e.target.checked } : x))} />
                          Enable
                        </label>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input type="number" min="0" step="0.1" placeholder="Meters" value={u.meters} onChange={(e) => setUnits(prev => prev.map((x, idx) => idx === i ? { ...x, meters: Number(e.target.value) } : x))} className="p-2 border border-border/40 rounded-md" />
                        <select value={u.material} onChange={(e) => setUnits(prev => prev.map((x, idx) => idx === i ? { ...x, material: e.target.value } : x))} className="p-2 border border-border/40 rounded-md">
                          <option value="">Material</option>
                          <option value="melamine">Melamine</option>
                          <option value="laminate">Laminate</option>
                          <option value="wood">Solid Wood</option>
                          <option value="premium">Premium Wood</option>
                        </select>
                        <select value={u.finish} onChange={(e) => setUnits(prev => prev.map((x, idx) => idx === i ? { ...x, finish: e.target.value } : x))} className="p-2 border border-border/40 rounded-md">
                          <option value="">Finish</option>
                          <option value="standard">Standard</option>
                          <option value="painted">Painted</option>
                          <option value="stained">Stained</option>
                          <option value="lacquer">Lacquer</option>
                        </select>
                        <select value={u.hardware} onChange={(e) => setUnits(prev => prev.map((x, idx) => idx === i ? { ...x, hardware: e.target.value } : x))} className="p-2 border border-border/40 rounded-md">
                          <option value="">Hardware</option>
                          <option value="basic">Basic</option>
                          <option value="soft_close">Soft-close</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cabinet Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Cabinet Quality</label>
                <div className="space-y-2">
                  {[
                    { value: "basic", label: "Basic", desc: "Standard quality cabinets" },
                    { value: "premium", label: "Premium", desc: "Enhanced features and materials" },
                    { value: "luxury", label: "Luxury", desc: "Top-tier quality and finishes" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange("cabinetType", option.value)}
                      className={`w-full p-3 rounded-md border text-left transition-all duration-200 ${
                        formData.cabinetType === option.value
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border/40 text-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm opacity-80">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Material</label>
                <select
                  value={formData.material}
                  onChange={(e) => handleInputChange("material", e.target.value)}
                  className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Material</option>
                  <option value="melamine">Melamine</option>
                  <option value="laminate">Laminate</option>
                  <option value="wood">Solid Wood</option>
                  <option value="premium">Premium Wood</option>
                </select>
              </div>

              {/* Installation */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="installation"
                  checked={formData.installation}
                  onChange={(e) => handleInputChange("installation", e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border/40 rounded focus:ring-primary/20"
                />
                <label htmlFor="installation" className="ml-2 text-sm font-medium text-foreground">
                  Include Professional Installation
                </label>
              </div>

              <button
                onClick={calculateEstimate}
                className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200"
              >
                Calculate Estimate
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Discount (0–1)</label>
                  <input type="number" min="0" max="1" step="0.01" value={discount} onChange={(e)=>setDiscount(parseFloat(e.target.value)||0)} className="w-full p-2 border border-border/40 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate</label>
                  <input type="number" min="0" max="1" step="0.01" value={taxRate} onChange={(e)=>setTaxRate(parseFloat(e.target.value)||0)} className="w-full p-2 border border-border/40 rounded-md" />
                </div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" checked={applyTax} onChange={(e)=>setApplyTax(e.target.checked)} /> Apply Tax
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>{localStorage.setItem("calculator_config", JSON.stringify({ formData, units, applyTax, taxRate, discount, cabinetCategory, tier })); toast.success("Configuration saved")}} className="px-3 py-2 rounded-md border">Save Config</button>
                <button onClick={()=>{try{const raw=localStorage.getItem("calculator_config"); if(!raw){toast.error("No saved config") ;return} const cfg=JSON.parse(raw); setFormData(cfg.formData); setUnits(cfg.units); setApplyTax(cfg.applyTax); setTaxRate(cfg.taxRate); setDiscount(cfg.discount); setCabinetCategory(cfg.cabinetCategory); setTier(cfg.tier); toast.success("Configuration loaded")}catch{toast.error("Failed to load config")}}} className="px-3 py-2 rounded-md border">Load Config</button>
                <button onClick={()=>window.print()} className="px-3 py-2 rounded-md border">Print / PDF</button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Your Estimate</h2>

            <div className="mb-6">
              <LazyImage
                src={cabinetCategory === "base" ? "/placeholder.svg?height=200&width=400&text=Base+Cabinet" : cabinetCategory === "hanging" ? "/placeholder.svg?height=200&width=400&text=Hanging+Cabinet" : "/placeholder.svg?height=200&width=400&text=Tall+Unit"}
                alt="Cabinet preview"
                width={400}
                height={200}
                className="rounded-md border"
              />
            </div>

            {estimate ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary mb-2">₱{estimate.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Estimated Project Cost</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border">
                    <div className="font-medium">Subtotal</div>
                    <div>₱{(subtotal||0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded border">
                    <div className="font-medium">Tax</div>
                    <div>₱{(tax||0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Type:</span>
                    <span className="font-medium text-foreground capitalize">{formData.projectType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabinet Type:</span>
                    <span className="font-medium text-foreground capitalize">{cabinetCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality Tier:</span>
                    <span className="font-medium text-foreground capitalize">{tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linear Meters:</span>
                    <span className="font-medium text-foreground">{formData.linearMeter} m</span>
                  </div>
                  {formData.projectType === "kitchen" && formData.kitchenScope && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kitchen Scope:</span>
                      <span className="font-medium text-foreground">
                        {formData.kitchenScope === "base_only" ? "Base Cabinets Only" : "Hanging Cabinets Only"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabinet Quality:</span>
                    <span className="font-medium text-foreground capitalize">{formData.cabinetType}</span>
                  </div>
                  {formData.material && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium text-foreground capitalize">{formData.material}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installation:</span>
                    <span className="font-medium text-foreground">
                      {formData.installation ? "Included" : "Not Included"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-4">
                    * This is an approximate estimate. Final pricing may vary based on specific requirements, site
                    conditions, and material availability.
                  </p>
                  <div className="space-y-3 mb-3">
                    <div className="text-sm font-semibold">Select Client</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {contacts.slice(0,6).map((c)=> (
                        <button key={c.id} type="button" onClick={()=>setSelectedClient(c)} className={`px-3 py-2 rounded-md border text-sm ${selectedClient?.id===c.id?"bg-primary text-white border-primary":"hover:bg-muted/50"}`}>
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-xs opacity-80 truncate">{c.email}</div>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input placeholder="Search contacts" className="p-2 border rounded-md text-sm" onChange={(e)=>{
                        const q = e.target.value.toLowerCase()
                        const db = contactsAll as any[]
                        const filtered = db.filter((c)=> {
                          const tags = Array.isArray(c.tags)?c.tags:[]
                          return String(c.name||"").toLowerCase().includes(q)
                            || String(c.email||"").toLowerCase().includes(q)
                            || String(c.company||"").toLowerCase().includes(q)
                            || tags.some((t:string)=>String(t||"").toLowerCase().includes(q))
                        })
                        setContacts(q?filtered:contactsAll)
                      }} />
                      {selectedClient && (
                        <div className="md:col-span-2 text-xs text-muted-foreground">Selected: {selectedClient.name} ({selectedClient.email})</div>
                      )}
                    </div>
                    {contacts.length === 0 && (
                      <div className="text-xs text-muted-foreground">No matches. Manage contacts in <a href="/admin/crm" className="underline">CRM</a>.</div>
                    )}
                  </div>
                  <button
                    className={`w-full py-3 px-6 rounded-md font-medium transition-colors duration-200 ${selectedClient?"bg-secondary text-white hover:bg-secondary/90":"bg-muted text-muted-foreground cursor-not-allowed"}`}
                    disabled={!selectedClient}
                    onClick={async ()=>{
                      if (!selectedClient || !estimate) return
                      const legacyLm = parseFloat(formData.linearMeter)
                      const activeUnits = units
                        .filter((u) => u.enabled && Number(u.meters) > 0)
                        .map((u) => ({ category: u.category, meters: Number(u.meters), material: u.material || undefined, finish: u.finish || undefined, hardware: u.hardware || undefined, tier: u.tier || tier }))
                      const useLegacy = !activeUnits.length && !isNaN(legacyLm) && legacyLm > 0
                      const calc = estimateCabinetCost({
                        projectType: formData.projectType,
                        cabinetType: formData.cabinetType,
                        linearMeter: useLegacy ? legacyLm : undefined,
                        installation: formData.installation,
                        cabinetCategory,
                        tier,
                        baseRates: baseRates || undefined,
                        tierMultipliers: tiers || undefined,
                        units: activeUnits,
                        discount,
                        applyTax,
                        taxRate,
                      })
                      const items = (calc?.breakdown?.units||[]).map((u:any)=>({
                        description: `${u.category} cabinets (${formData.cabinetType})`,
                        quantity: Number(u.meters||0),
                        unitPrice: Math.round(Number(u.lineTotal||0)/Math.max(1, Number(u.meters||1)))
                      }))
                      const payload = {
                        client: { name: selectedClient.name||"", email: selectedClient.email||"", company: selectedClient.company||"" },
                        title: `${formData.projectType||"Project"} Proposal`,
                        items,
                        taxRate: applyTax ? taxRate*100 : 0,
                        discount: Math.round((discount||0)* (calc?.breakdown?.subtotal||0)),
                        notes: "Auto-generated from calculator",
                      }
                      try {
                        const res = await fetch("/api/proposals/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                        const data = await res.json().catch(()=>({}))
                        if (data?.id) {
                          window.location.href = `/admin/proposals?id=${encodeURIComponent(data.id)}`
                        }
                      } catch {}
                    }}
                  >
                    Request Detailed Quote
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-muted-foreground">Fill out the project details to get your estimate</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Important Notes:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Estimates are based on standard configurations and may vary</li>
            <li>• Final pricing depends on specific measurements and requirements</li>
            <li>• Additional costs may apply for custom designs or special materials</li>
            <li>• Contact us for a detailed consultation and accurate quote</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
