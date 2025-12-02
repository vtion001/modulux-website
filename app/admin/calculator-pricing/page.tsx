import { revalidatePath } from "next/cache"
export const dynamic = "force-dynamic"
import { AdminCalculatorEmbed } from "@/components/admin/admin-calculator-embed"
import { supabaseServer } from "@/lib/supabase-server"
import { promises as fs } from "fs"
import path from "path"
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
async function deleteVersion(formData: FormData) {
  "use server"
  const ts = Number(formData.get("ts"))
  if (!ts) return
  const supabase = supabaseServer()
  await supabase.from("calculator_pricing_versions").delete().eq("ts", ts)
  revalidatePath("/admin/calculator-pricing")
}
export default async function AdminCalculatorPricingPage() {
  const supabase = supabaseServer()
  const { data: versions } = await supabase
    .from("calculator_pricing_versions")
    .select("ts")
    .order("ts", { ascending: false })
  const { data: currentRow } = await supabase
    .from("calculator_pricing")
    .select("data,updated_at")
    .eq("id", "current")
    .single()
  // Auto-delete versions older than 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  await supabase.from("calculator_pricing_versions").delete().lt("ts", thirtyDaysAgo)
  let localVersions: any[] = []
  try {
    const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
    const txt = await fs.readFile(versionsPath, "utf-8")
    const parsed = JSON.parse(txt || "[]")
    localVersions = Array.isArray(parsed) ? parsed.map((v: any) => ({ ts: v.ts })) : []
  } catch {}
  const mergedVersions = [...(versions || []), ...localVersions]
    .filter((v, i, arr) => arr.findIndex((x: any) => x.ts === v.ts) === i)
    .sort((a: any, b: any) => Number(b.ts) - Number(a.ts))
  async function restorePricing() {}
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <AdminCalculatorEmbed versionKey={(mergedVersions[0]?.ts as number) || 0} />
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">Active Pricing</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Base Rates</div>
            <div>Base: {String(currentRow?.data?.baseRates?.base ?? "—")}</div>
            <div>Hanging: {String(currentRow?.data?.baseRates?.hanging ?? "—")}</div>
            <div>Tall: {String(currentRow?.data?.baseRates?.tall ?? "—")}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Tier Multipliers</div>
            <div>Luxury: {String(currentRow?.data?.tierMultipliers?.luxury ?? "—")}</div>
            <div>Premium: {String(currentRow?.data?.tierMultipliers?.premium ?? "—")}</div>
            <div>Standard: {String(currentRow?.data?.tierMultipliers?.standard ?? "—")}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Type Multipliers</div>
            <div>Luxury: {String(currentRow?.data?.cabinetTypeMultipliers?.luxury ?? "—")}</div>
            <div>Premium: {String(currentRow?.data?.cabinetTypeMultipliers?.premium ?? "—")}</div>
            <div>Basic: {String(currentRow?.data?.cabinetTypeMultipliers?.basic ?? "—")}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">Updated: {currentRow?.updated_at ? new Date(currentRow.updated_at).toLocaleString() : "—"}</div>
      </div>
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">Pricing Versions</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {mergedVersions.map((v: any) => (
            <div key={v.ts} className="flex items-center justify-between gap-2 border rounded p-2">
              <div className="text-xs text-muted-foreground">{new Date(v.ts).toLocaleString()}</div>
              <div className="flex gap-2">
                <form action="/api/pricing/restore" method="GET">
                  <input type="hidden" name="ts" value={String(v.ts)} />
                  <button type="submit" className="px-3 py-1 rounded-md border text-xs">Restore</button>
                </form>
                <form action={deleteVersion}>
                  <input type="hidden" name="ts" value={String(v.ts)} />
                  <button type="submit" className="px-3 py-1 rounded-md border text-xs text-red-600 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
