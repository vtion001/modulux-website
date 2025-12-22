import { revalidatePath } from "next/cache"
export const dynamic = "force-dynamic"
import { supabaseServer } from "@/lib/supabase-server"
import { promises as fs } from "fs"
import path from "path"

import nextDynamic from "next/dynamic"

const AdminCalculatorEmbed = nextDynamic(
  () => import("@/components/admin/admin-calculator-embed").then((mod) => mod.AdminCalculatorEmbed),
  { ssr: false, loading: () => <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">Loading Calculator...</div> }
)
import Link from "next/link"
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
  try {
    const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
    const raw = await fs.readFile(versionsPath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(raw || "[]")
    const next = Array.isArray(arr) ? arr.filter((v: any) => Number(v?.ts) !== ts) : []
    await fs.writeFile(versionsPath, JSON.stringify(next, null, 2))
  } catch { }
  revalidatePath("/admin/calculator-pricing")
}
async function clearAllVersions() {
  "use server"
  const supabase = supabaseServer()
  await supabase.from("calculator_pricing_versions").delete().gt("ts", 0)
  try {
    const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
    await fs.writeFile(versionsPath, "[]")
  } catch { }
  revalidatePath("/admin/calculator-pricing")
}
export default async function AdminCalculatorPricingPage({ searchParams }: { searchParams: any }) {
  const supabase = supabaseServer()
  const { data: versions } = await supabase
    .from("calculator_pricing_versions")
    .select("ts,data")
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
    localVersions = Array.isArray(parsed) ? parsed.map((v: any) => ({ ts: v.ts, data: v.data })) : []
  } catch { }
  const mergedVersions = [...(versions || []), ...localVersions]
    .filter((v, i, arr) => arr.findIndex((x: any) => x.ts === v.ts) === i)
    .sort((a: any, b: any) => Number(b.ts) - Number(a.ts))
  async function restorePricing(formData: FormData) {
    "use server"
    const tsStr = formData.get("ts")
    if (!tsStr) return
    const ts = Number(tsStr)
    const supabase = supabaseServer()
    const { data: ver } = await supabase.from("calculator_pricing_versions").select("data").eq("ts", ts).single()
    let payload = ver?.data
    if (!payload) {
      const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
      try {
        const txt = await fs.readFile(versionsPath, "utf-8")
        const arr = JSON.parse(txt || "[]")
        const hit = (Array.isArray(arr) ? arr : []).find((v: any) => Number(v.ts) === ts)
        if (hit) payload = hit.data
      } catch { }
    }
    if (payload) {
      await supabase.from("calculator_pricing").upsert({ id: "current", data: payload, updated_at: new Date().toISOString() })
      revalidatePath("/admin/calculator-pricing")
    }
  }
  const activeKey = currentRow?.updated_at ? new Date(currentRow.updated_at).getTime() : (mergedVersions[0]?.ts as number) || 0

  // Get view data if requested
  const sParams = searchParams
  const viewTs = Number(sParams?.view || 0)
  const viewData = viewTs ? mergedVersions.find(v => Number(v.ts) === viewTs) : null
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <AdminCalculatorEmbed key={activeKey} initialData={currentRow?.data} />
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">Active Pricing</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Base Rates</div>
            <div>Base: {String(currentRow?.data?.baseRates?.base ?? "-")}</div>
            <div>Hanging: {String(currentRow?.data?.baseRates?.hanging ?? "-")}</div>
            <div>Tall: {String(currentRow?.data?.baseRates?.tall ?? "-")}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Tier Multipliers</div>
            <div>Luxury: {String(currentRow?.data?.tierMultipliers?.luxury ?? "-")}</div>
            <div>Premium: {String(currentRow?.data?.tierMultipliers?.premium ?? "-")}</div>
            <div>Standard: {String(currentRow?.data?.tierMultipliers?.standard ?? "-")}</div>
          </div>
          <div className="border rounded p-2">
            <div className="font-medium mb-1">Type Multipliers</div>
            <div>Luxury: {String(currentRow?.data?.cabinetTypeMultipliers?.luxury ?? "-")}</div>
            <div>Premium: {String(currentRow?.data?.cabinetTypeMultipliers?.premium ?? "-")}</div>
            <div>Basic: {String(currentRow?.data?.cabinetTypeMultipliers?.basic ?? "-")}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">Updated: {currentRow?.updated_at ? new Date(currentRow.updated_at).toLocaleString() : "-"}</div>
      </div>
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Pricing Versions</div>
          {mergedVersions.length > 0 && (
            <form action={clearAllVersions}>
              <button type="submit" className="text-[10px] font-bold uppercase tracking-tight text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition-colors">
                Clear All
              </button>
            </form>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {mergedVersions.map((v: any) => (
            <div key={v.ts} className="flex flex-col gap-2 border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">{new Date(v.ts).toLocaleString()}</div>
                {v.data?.prefill?.estimate && (
                  <div className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                    ₱{Number(v.data.prefill.estimate).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex gap-1 justify-end">
                <Link href={`?view=${v.ts}`} scroll={false} className="px-2 py-1 rounded border text-[10px] font-medium hover:bg-muted/50 transition-colors">View</Link>
                <form action={restorePricing}>
                  <input type="hidden" name="ts" value={String(v.ts)} />
                  <button type="submit" className="px-2 py-1 rounded border text-[10px] font-medium hover:bg-muted/50 transition-colors">Restore</button>
                </form>
                <form action={deleteVersion}>
                  <input type="hidden" name="ts" value={String(v.ts)} />
                  <button type="submit" className="px-2 py-1 rounded border text-[10px] font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Link href="/admin/calculator-pricing" scroll={false} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-card border border-border/40 rounded-xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm pb-4 border-b z-10">
              <div>
                <h3 className="text-xl font-bold">Version Details</h3>
                <p className="text-xs text-muted-foreground">{new Date(viewData.ts).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <form action={restorePricing}>
                  <input type="hidden" name="ts" value={String(viewData.ts)} />
                  <button type="submit" className="px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm">Restore this Version</button>
                </form>
                <Link
                  href={`/admin/proposals?aiTs=${viewData.ts}`}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2"
                >
                  AI Fill
                </Link>
                <Link href="/admin/calculator-pricing" scroll={false} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-sm font-bold uppercase tracking-wider text-primary/70">Project Summary</div>
                <div className="grid grid-cols-2 text-sm gap-y-3 p-4 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize font-medium">{viewData.data?.prefill?.formData?.projectType || "-"}</span>
                  <span className="text-muted-foreground">Quality Tier:</span>
                  <span className="capitalize font-medium">{viewData.data?.prefill?.tier || "-"}</span>
                  <span className="text-muted-foreground">Installation:</span>
                  <span className="font-medium">{viewData.data?.prefill?.formData?.installation ? "Included" : "Excluded"}</span>
                  <span className="text-muted-foreground">VAT & Fees:</span>
                  <span className="font-medium">{viewData.data?.prefill?.includeFees ? "Yes" : "No"}</span>
                  <span className="text-muted-foreground">Import (10%):</span>
                  <span className="font-medium">{viewData.data?.prefill?.importSurcharge ? "Yes" : "No"}</span>
                  <span className="text-muted-foreground">MFC Downgrade:</span>
                  <span className="font-medium">{viewData.data?.prefill?.downgradeMFC ? "Yes (-10%)" : "No"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-bold uppercase tracking-wider text-primary/70">Calculation Breakdown</div>
                <div className="grid grid-cols-2 text-sm gap-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">₱{Number(viewData.data?.prefill?.subtotal || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">₱{Number(viewData.data?.prefill?.tax || 0).toLocaleString()}</span>
                  <div className="col-span-2 border-t pt-2 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total Estimate:</span>
                      <span className="font-bold text-lg text-primary">₱{Number(viewData.data?.prefill?.estimate || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {viewData.data?.prefill?.discount > 0 && (
                    <div className="col-span-2 mt-2 py-1 px-3 bg-green-50 text-green-700 text-xs rounded-full inline-flex items-center gap-1 font-semibold">
                      Applied Discount: {(viewData.data.prefill.discount * 100).toFixed(0)}% Off
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-bold uppercase tracking-wider text-primary/70">Cabinet Details</div>
              <div className="overflow-hidden border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 font-semibold">Set</th>
                      <th className="p-3 font-semibold">Room</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Qty (m)</th>
                      <th className="p-3 font-semibold">Material</th>
                      <th className="p-3 font-semibold">Finish</th>
                      <th className="p-3 font-semibold">Hardware</th>
                      <th className="p-3 font-semibold">Tier</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(viewData.data?.prefill?.units || []).filter((u: any) => Number(u.meters) > 0).map((u: any, idx: number) => {
                      const rt = u.roomType || "kitchen"
                      const cn = u.customRoomName || ""
                      const roomLabel = rt === 'custom' ? (cn || 'Custom') : (rt ? rt[0].toUpperCase() + rt.slice(1) : '')
                      const setLabel = typeof u.setId === 'number' ? String(u.setId + 1) : '-'
                      return (
                        <tr key={idx} className={`hover:bg-muted/30 transition-colors ${!u.enabled ? "opacity-50" : ""}`}>
                          <td className="p-3 font-medium">{setLabel}</td>
                          <td className="p-3">{roomLabel}</td>
                          <td className="p-3 capitalize">{u.category}</td>
                          <td className="p-3 font-medium">{u.meters}m</td>
                          <td className="p-3 capitalize">{u.material || "-"}</td>
                          <td className="p-3 capitalize">{u.finish || "-"}</td>
                          <td className="p-3 capitalize">{u.hardware || "-"}</td>
                          <td className="p-3 capitalize">{u.tier || viewData.data?.prefill?.tier || "-"}</td>
                          <td className="p-3">
                            {u.enabled ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-tighter">Active</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-tighter">Disabled</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Link href="/admin/calculator-pricing" scroll={false} className="px-6 py-2 rounded-md border font-medium hover:bg-muted transition-colors">
                Back to Pricing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
