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

export function AdminCalculatorEmbed(): React.ReactElement {
  const [formData, setFormData] = useState<CalculatorState>({
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

  const [estimate, setEstimate] = useState<number | null>(null)
  const [subtotal, setSubtotal] = useState<number | null>(null)
  const [tax, setTax] = useState<number | null>(null)
  const [lines, setLines] = useState<any[]>([])
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
  const [baseRates, setBaseRates] = useState<{ base: number; hanging: number; tall: number } | null>(null)
  const [tiers, setTiers] = useState<{ luxury: number; premium: number; standard: number } | null>(null)
  const [cabinetCategory, setCabinetCategory] = useState<string>("base")
  const [tier, setTier] = useState<string>("luxury")
  const [sheetRates, setSheetRates] = useState<any>(null)
  const [ctMultipliers, setCtMultipliers] = useState<{ luxury: number; premium: number; basic: number } | null>(null)

  const [units, setUnits] = useState([
    { enabled: true, category: "base", meters: 0, material: "", finish: "", hardware: "", tier: "" },
    { enabled: false, category: "hanging", meters: 0, material: "", finish: "", hardware: "", tier: "" },
    { enabled: false, category: "tall", meters: 0, material: "", finish: "", hardware: "", tier: "" },
  ])
  const [applyTax, setApplyTax] = useState(true)
  const [taxRate, setTaxRate] = useState(0.12)
  const [discount, setDiscount] = useState(0)
  const [includeFees, setIncludeFees] = useState(true)
  const [importSurcharge, setImportSurcharge] = useState(false)
  const [downgradeMFC, setDowngradeMFC] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/data/calculator-pricing.json")
        const cfg = await res.json()
        if (cfg?.baseRates) setBaseRates(cfg.baseRates)
        if (cfg?.tierMultipliers) setTiers(cfg.tierMultipliers)
        if (cfg?.sheetRates) setSheetRates(cfg.sheetRates)
        else setSheetRates({
          base: { withoutFees: 40476.4, withFees: 51097.4 },
          hanging: { withoutFees: 38452.58, withFees: 48542.53 },
          tall: { withoutFees: 65182.2, withFees: 82286.1 },
        })
        if (cfg?.cabinetTypeMultipliers) setCtMultipliers(cfg.cabinetTypeMultipliers)
      } catch {}
    })()
  }, [])

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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Project Cost Calculator</h1>
          <p className="text-lg text-muted-foreground">Estimate modular cabinet costs quickly inside Admin.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Project Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Project Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["kitchen","bathroom","bedroom","office"].map((value)=> (
                    <button key={value} onClick={() => handleInputChange("projectType", value)} className={`p-3 rounded-md border text-sm font-medium transition-all ${formData.projectType===value?"bg-primary text-white border-primary":"bg-background text-foreground border-border/40 hover:border-primary/50"}`}>{value[0].toUpperCase()+value.slice(1)}</button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Cabinet Type</label>
                    <select value={cabinetCategory} onChange={(e)=>setCabinetCategory(e.target.value)} className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="base">Base Cabinet</option>
                      <option value="hanging">Hanging Cabinet</option>
                      <option value="tall">Tall Units</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Quality Tier</label>
                    <select value={tier} onChange={(e)=>setTier(e.target.value)} className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="luxury">Luxury</option>
                      <option value="premium">Premium</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Linear Meters (fallback)</label>
                    <input type="number" min="0" step="0.1" value={formData.linearMeter} onChange={(e)=>handleInputChange("linearMeter", e.target.value)} className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={includeFees} onChange={(e)=>setIncludeFees(e.target.checked)} /> Include VAT & Legal Fees</label>
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={importSurcharge} onChange={(e)=>setImportSurcharge(e.target.checked)} /> Add 10% Import (Manila)</label>
                  <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={downgradeMFC} onChange={(e)=>setDowngradeMFC(e.target.checked)} /> Downgrade to MFC (-10%)</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Cabinet Units</label>
                <div className="space-y-3">
                  {units.map((u,i)=> (
                    <div key={u.category} className="border border-border/40 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground capitalize">{u.category} units</div>
                        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" className="w-4 h-4" checked={u.enabled} onChange={(e)=>setUnits(prev=>prev.map((x,idx)=>idx===i?{...x,enabled:e.target.checked}:x))}/>Enable</label>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input type="number" min="0" step="0.1" placeholder="Meters" value={u.meters} onChange={(e)=>setUnits(prev=>prev.map((x,idx)=>idx===i?{...x,meters:parseFloat(e.target.value)||0}:x))} className="p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <select value={u.material} onChange={(e)=>setUnits(prev=>prev.map((x,idx)=>idx===i?{...x,material:e.target.value}:x))} className="p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Material</option><option value="melamine">Melamine</option><option value="laminate">Laminate</option><option value="wood">Solid Wood</option><option value="premium">Premium Wood</option></select>
                        <select value={u.finish} onChange={(e)=>setUnits(prev=>prev.map((x,idx)=>idx===i?{...x,finish:e.target.value}:x))} className="p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Finish</option><option value="standard">Standard</option><option value="painted">Painted</option><option value="stained">Stained</option><option value="lacquer">Lacquer</option></select>
                        <select value={u.hardware} onChange={(e)=>setUnits(prev=>prev.map((x,idx)=>idx===i?{...x,hardware:e.target.value}:x))} className="p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="">Hardware</option><option value="basic">Basic</option><option value="soft_close">Soft-close</option><option value="premium">Premium</option></select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center"><input type="checkbox" id="installation" checked={formData.installation} onChange={(e)=>handleInputChange("installation", e.target.checked)} className="w-4 h-4"/><label htmlFor="installation" className="ml-2 text-sm font-medium text-foreground">Include Professional Installation</label></div>

              <button onClick={calculateEstimate} className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors">Calculate Estimate</button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Discount (0–1)</label><input type="number" min="0" max="1" step="0.01" value={discount} onChange={(e)=>setDiscount(parseFloat(e.target.value)||0)} className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Tax Rate</label><input type="number" min="0" max="1" step="0.01" value={taxRate} onChange={(e)=>setTaxRate(parseFloat(e.target.value)||0)} className="w-full p-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <label className="flex items-center gap-2 text-sm mt-6 text-foreground"><input type="checkbox" checked={applyTax} onChange={(e)=>setApplyTax(e.target.checked)} /> Apply Tax</label>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>{localStorage.setItem("calculator_config", JSON.stringify({ formData, units, applyTax, taxRate, discount, cabinetCategory, tier, includeFees, importSurcharge, downgradeMFC })); toast.success("Configuration saved")}} className="px-3 py-2 rounded-md border text-foreground hover:bg-muted/30">Save Config</button>
                <button onClick={()=>{try{const raw=localStorage.getItem("calculator_config"); if(!raw){toast.error("No saved config");return} const cfg=JSON.parse(raw); setFormData(cfg.formData); setUnits(cfg.units); setApplyTax(cfg.applyTax); setTaxRate(cfg.taxRate); setDiscount(cfg.discount); setCabinetCategory(cfg.cabinetCategory); setTier(cfg.tier); setIncludeFees(Boolean(cfg.includeFees)); setImportSurcharge(Boolean(cfg.importSurcharge)); setDowngradeMFC(Boolean(cfg.downgradeMFC)); toast.success("Configuration loaded")}catch{toast.error("Failed to load config")}}} className="px-3 py-2 rounded-md border text-foreground hover:bg-muted/30">Load Config</button>
                <button onClick={()=>window.print()} className="px-3 py-2 rounded-md border text-foreground hover:bg-muted/30">Print / PDF</button>
                <button onClick={()=>setConfigOpen(true)} className="ml-auto px-3 py-2 rounded-md border text-foreground hover:bg-muted/30">Pricing Configuration</button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Estimate</h2>
            <div className="mb-6">
              <LazyImage src={cabinetCategory === "base" ? "/placeholder.svg?height=200&width=400&text=Base+Cabinet" : cabinetCategory === "hanging" ? "/placeholder.svg?height=200&width=400&text=Hanging+Cabinet" : "/placeholder.svg?height=200&width=400&text=Tall+Unit"} alt="Cabinet preview" width={400} height={200} className="rounded-md border" />
            </div>
            {estimate ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary mb-2">₱{estimate.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Estimated Project Cost</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border"><div className="font-medium text-foreground">Subtotal</div><div className="text-foreground">₱{(subtotal||0).toLocaleString()}</div></div>
                  <div className="p-3 rounded border"><div className="font-medium text-foreground">Tax</div><div className="text-foreground">₱{(tax||0).toLocaleString()}</div></div>
                </div>
                {lines.length > 0 && (
                  <div className="text-xs border rounded">
                    <div className="p-2 font-semibold">Breakdown</div>
                    <div className="overflow-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Category</th>
                            <th className="text-left p-2">Meters</th>
                            <th className="text-left p-2">Rate</th>
                            <th className="text-left p-2">Tier</th>
                            <th className="text-left p-2">Material</th>
                            <th className="text-left p-2">Finish</th>
                            <th className="text-left p-2">Hardware</th>
                            <th className="text-left p-2">Install</th>
                            <th className="text-right p-2">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((row, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2 capitalize">{row.category}</td>
                              <td className="p-2">{row.meters}</td>
                              <td className="p-2">₱{Number(row.baseRate||0).toLocaleString()}/m</td>
                              <td className="p-2">×{row.tierFactor}</td>
                              <td className="p-2">×{row.materialFactor}</td>
                              <td className="p-2">×{row.finishFactor}</td>
                              <td className="p-2">×{row.hardwareFactor}</td>
                              <td className="p-2">₱{Number(row.installationAdd||0).toLocaleString()}</td>
                              <td className="p-2 text-right">₱{Number(row.lineTotal||0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="text-xs border rounded">
                  <div className="p-2 font-semibold">Specification • {tier[0].toUpperCase()+tier.slice(1)}</div>
                  <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="font-medium mb-1">Included</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {(tierSpecs[tier]?.items || []).map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Exclusive</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {(tierSpecs[tier]?.exclusive || []).map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-4">* Approximate estimate for planning purposes.</p>
                  <button className="w-full bg-secondary text-white py-3 px-6 rounded-md font-medium hover:bg-secondary/90" onClick={()=>{const body=`Estimate Total: ₱${estimate?.toLocaleString()}\nSubtotal: ₱${(subtotal||0).toLocaleString()}\nTax: ₱${(tax||0).toLocaleString()}`; window.location.href=`mailto:?subject=ModuLux Estimate&body=${encodeURIComponent(body)}`}}>Request Detailed Quote</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-muted-foreground">Fill out the project details to get your estimate</p></div>
            )}
          </div>
        </div>
      </div>
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-card rounded-lg shadow-lg border border-border/40 p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Pricing Configuration</h3>
            {editor && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Base Rate (Base)</label>
                    <input type="number" value={editor.baseRates.base} onChange={(e)=>setEditor({...editor, baseRates:{...editor.baseRates, base:Number(e.target.value)||0}})} className="w-full p-2 border border-border/40 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Base Rate (Hanging)</label>
                    <input type="number" value={editor.baseRates.hanging} onChange={(e)=>setEditor({...editor, baseRates:{...editor.baseRates, hanging:Number(e.target.value)||0}})} className="w-full p-2 border border-border/40 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Base Rate (Tall)</label>
                    <input type="number" value={editor.baseRates.tall} onChange={(e)=>setEditor({...editor, baseRates:{...editor.baseRates, tall:Number(e.target.value)||0}})} className="w-full p-2 border border-border/40 rounded" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-foreground">Spreadsheet Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Base w/o Fees</label>
                      <input type="number" value={editor.sheetRates.base.withoutFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, base:{...editor.sheetRates.base, withoutFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Base with Fees</label>
                      <input type="number" value={editor.sheetRates.base.withFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, base:{...editor.sheetRates.base, withFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Hanging w/o Fees</label>
                      <input type="number" value={editor.sheetRates.hanging.withoutFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, hanging:{...editor.sheetRates.hanging, withoutFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Hanging with Fees</label>
                      <input type="number" value={editor.sheetRates.hanging.withFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, hanging:{...editor.sheetRates.hanging, withFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tall w/o Fees</label>
                      <input type="number" value={editor.sheetRates.tall.withoutFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, tall:{...editor.sheetRates.tall, withoutFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tall with Fees</label>
                      <input type="number" value={editor.sheetRates.tall.withFees} onChange={(e)=>setEditor({...editor, sheetRates:{...editor.sheetRates, tall:{...editor.sheetRates.tall, withFees:Number(e.target.value)||0}}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-foreground">Multipliers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tier Luxury</label>
                      <input type="number" step="0.01" value={editor.tierMultipliers.luxury} onChange={(e)=>setEditor({...editor, tierMultipliers:{...editor.tierMultipliers, luxury:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tier Premium</label>
                      <input type="number" step="0.01" value={editor.tierMultipliers.premium} onChange={(e)=>setEditor({...editor, tierMultipliers:{...editor.tierMultipliers, premium:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tier Standard</label>
                      <input type="number" step="0.01" value={editor.tierMultipliers.standard} onChange={(e)=>setEditor({...editor, tierMultipliers:{...editor.tierMultipliers, standard:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Type Luxury</label>
                      <input type="number" step="0.01" value={editor.cabinetTypeMultipliers.luxury} onChange={(e)=>setEditor({...editor, cabinetTypeMultipliers:{...editor.cabinetTypeMultipliers, luxury:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Type Premium</label>
                      <input type="number" step="0.01" value={editor.cabinetTypeMultipliers.premium} onChange={(e)=>setEditor({...editor, cabinetTypeMultipliers:{...editor.cabinetTypeMultipliers, premium:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Type Basic</label>
                      <input type="number" step="0.01" value={editor.cabinetTypeMultipliers.basic} onChange={(e)=>setEditor({...editor, cabinetTypeMultipliers:{...editor.cabinetTypeMultipliers, basic:Number(e.target.value)||1}})} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={()=>savePricingConfig()} className="px-3 py-2 rounded-md border bg-primary text-white">Save</button>
                  <button onClick={()=>setConfigOpen(false)} className="px-3 py-2 rounded-md border">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
