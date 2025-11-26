import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"

const filePath = path.join(process.cwd(), "data", "calculator-pricing.json")

async function savePricing(formData: FormData) {
  "use server"
  const base_base = Number(formData.get("base_base") || 0)
  const base_hanging = Number(formData.get("base_hanging") || 0)
  const base_tall = Number(formData.get("base_tall") || 0)
  const tier_luxury = Number(formData.get("tier_luxury") || 1)
  const tier_premium = Number(formData.get("tier_premium") || 1)
  const tier_standard = Number(formData.get("tier_standard") || 1)
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const next = {
    baseRates: { base: base_base || 0, hanging: base_hanging || 0, tall: base_tall || 0 },
    tierMultipliers: { luxury: tier_luxury || 1, premium: tier_premium || 1, standard: tier_standard || 1 },
  }
  await writeFile(filePath, JSON.stringify(next, null, 2))
  revalidatePath("/calculator")
  revalidatePath("/admin/calculator-pricing")
}

export default async function AdminCalculatorPricingPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw || "{}") as any
  const baseRates = cfg.baseRates || { base: 2.0, hanging: 1.6, tall: 2.2 }
  const tiers = cfg.tierMultipliers || { luxury: 1.0, premium: 0.9, standard: 0.8 }
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calculator Pricing</h1>
        <p className="text-sm text-muted-foreground">Manage base rates and tier multipliers</p>
      </div>
      <form action={savePricing} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Base Cabinet (per m)</label>
            <input name="base_base" defaultValue={baseRates.base} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Hanging Cabinet (per m)</label>
            <input name="base_hanging" defaultValue={baseRates.hanging} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tall Units (per m)</label>
            <input name="base_tall" defaultValue={baseRates.tall} className="w-full p-2 border border-border/40 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Luxury multiplier</label>
            <input name="tier_luxury" defaultValue={tiers.luxury} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Premium multiplier</label>
            <input name="tier_premium" defaultValue={tiers.premium} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Standard multiplier</label>
            <input name="tier_standard" defaultValue={tiers.standard} className="w-full p-2 border border-border/40 rounded" />
          </div>
        </div>

        <button className="px-3 py-2 rounded-md border">Save</button>
      </form>
    </div>
  )
}

