import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data, error } = await supabase
      .from("calculator_pricing_versions")
      .select("ts,data")
      .order("ts", { ascending: false })
    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ versions: data }, { status: 200 })
    }
  } catch { }
  try {
    const p = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
    const txt = await readFile(p, "utf-8")
    const arr = JSON.parse(txt || "[]")
    const out = (Array.isArray(arr) ? arr : []).map((x: any) => ({ ts: x.ts, data: x.data }))
    return NextResponse.json({ versions: out }, { status: 200 })
  } catch {
    return NextResponse.json({ versions: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ts = Date.now()
    const supabase = supabaseServer()
    await supabase.from("calculator_pricing_versions").insert({ ts, data: body })

    // Also record as a structured estimate if it contains calculation data
    if (body.prefill) {
      const p = body.prefill
      const f = p.formData || {}
      await supabase.from("calculator_estimates").insert({
        id: `est_${ts}_${Math.random().toString(36).slice(2)}`,
        project_type: f.projectType || null,
        quality_tier: p.tier || null,
        linear_meters: Number(f.linearMeter) || 0,
        vat_included: !!p.includeFees,
        import_surcharge: !!p.importSurcharge,
        mfc_downgrade: !!p.downgradeMFC,
        installation_included: !!f.installation,
        room_type_selection: p.cabinetCategory || null,
        discount_rate: Number(p.discount) || 0,
        tax_rate: Number(p.taxRate) || 0.12,
        apply_tax: !!p.applyTax,
        subtotal: Number(p.subtotal) || 0,
        tax_amount: Number(p.tax) || 0,
        total_price: Number(p.estimate) || 0,
        unit_data: p.units || [],
        pricing_config: {
          baseRates: body.baseRates,
          tierMultipliers: body.tierMultipliers,
          sheetRates: body.sheetRates,
          cabinetTypeMultipliers: body.cabinetTypeMultipliers
        },
        created_at: new Date(ts).toISOString()
      })
    }

    try {
      const p = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
      const txt = await readFile(p, "utf-8").catch(() => "[]")
      const arr = JSON.parse(txt || "[]")
      arr.unshift({ ts, data: body })
      await writeFile(p, JSON.stringify(arr.slice(0, 100), null, 2))
    } catch { }

    return NextResponse.json({ ok: true, ts })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to add version" }, { status: 500 })
  }
}
