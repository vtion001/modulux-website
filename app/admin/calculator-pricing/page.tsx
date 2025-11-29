import { revalidatePath } from "next/cache"
import { AdminCalculatorEmbed } from "@/components/admin/admin-calculator-embed"
import { supabaseServer } from "@/lib/supabase-server"

const filePath = ""
const versionsPath = ""

async function savePricing(formData: FormData) {
  "use server"
  const base_base = Number(formData.get("base_base") || 0)
  const base_hanging = Number(formData.get("base_hanging") || 0)
  const base_tall = Number(formData.get("base_tall") || 0)
  const tier_luxury = Number(formData.get("tier_luxury") || 1)
  const tier_premium = Number(formData.get("tier_premium") || 1)
  const tier_standard = Number(formData.get("tier_standard") || 1)
  const sheet_base_without = Number(formData.get("sheet_base_without") || 0)
  const sheet_base_with = Number(formData.get("sheet_base_with") || 0)
  const sheet_hanging_without = Number(formData.get("sheet_hanging_without") || 0)
  const sheet_hanging_with = Number(formData.get("sheet_hanging_with") || 0)
  const sheet_tall_without = Number(formData.get("sheet_tall_without") || 0)
  const sheet_tall_with = Number(formData.get("sheet_tall_with") || 0)
  const ct_luxury = Number(formData.get("ct_luxury") || 1)
  const ct_premium = Number(formData.get("ct_premium") || 0.9)
  const ct_basic = Number(formData.get("ct_basic") || 0.8)
  const next = {
    baseRates: { base: base_base || 0, hanging: base_hanging || 0, tall: base_tall || 0 },
    tierMultipliers: { luxury: tier_luxury || 1, premium: tier_premium || 1, standard: tier_standard || 1 },
    sheetRates: {
      base: { withoutFees: sheet_base_without || 0, withFees: sheet_base_with || 0 },
      hanging: { withoutFees: sheet_hanging_without || 0, withFees: sheet_hanging_with || 0 },
      tall: { withoutFees: sheet_tall_without || 0, withFees: sheet_tall_with || 0 },
    },
    cabinetTypeMultipliers: { luxury: ct_luxury || 1, premium: ct_premium || 0.9, basic: ct_basic || 0.8 },
  }
  const supabase = supabaseServer()
  await supabase.from("calculator_pricing").upsert({ id: "current", data: next, updated_at: new Date().toISOString() }, { onConflict: "id" })
  await supabase.from("calculator_pricing_versions").insert({ ts: Date.now(), data: next })
  revalidatePath("/calculator")
  revalidatePath("/admin/calculator-pricing")
}

async function importPricing(formData: FormData) {
  "use server"
  const file = formData.get("import_file") as File | null
  if (!file) return
  const buf = Buffer.from(await file.arrayBuffer())
  const parsed = JSON.parse(buf.toString())
  const supabase = supabaseServer()
  await supabase.from("calculator_pricing").upsert({ id: "current", data: parsed, updated_at: new Date().toISOString() }, { onConflict: "id" })
  await supabase.from("calculator_pricing_versions").insert({ ts: Date.now(), data: parsed })
  revalidatePath("/calculator")
  revalidatePath("/admin/calculator-pricing")
}

export default async function AdminCalculatorPricingPage() {
  const supabase = supabaseServer()
  const { data: versions } = await supabase
    .from("calculator_pricing_versions")
    .select("ts")
    .order("ts", { ascending: false })

  async function restorePricing(formData: FormData) {
    "use server"
    const ts = Number(formData.get("ts") || 0)
    if (!ts) return
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing_versions").select("data,ts").eq("ts", ts).single()
    if (!data) return
    await supabase.from("calculator_pricing").upsert({ id: "current", data: data.data, updated_at: new Date().toISOString() }, { onConflict: "id" })
    revalidatePath("/calculator")
    revalidatePath("/admin/calculator-pricing")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <AdminCalculatorEmbed />
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">Pricing Versions</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(versions||[]).map((v: any) => (
            <form key={v.ts} action={restorePricing} className="flex items-center justify-between gap-2 border rounded p-2">
              <input type="hidden" name="ts" value={String(v.ts)} />
              <div className="text-xs text-muted-foreground">{new Date(v.ts).toLocaleString()}</div>
              <button className="px-3 py-1 rounded-md border text-xs">Restore</button>
            </form>
          ))}
          {(versions||[]).length === 0 && (
            <div className="text-xs text-muted-foreground">No versions yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
