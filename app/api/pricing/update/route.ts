import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const next = {
      baseRates: body.baseRates || { base: 0, hanging: 0, tall: 0 },
      tierMultipliers: body.tierMultipliers || { luxury: 1, premium: 1, standard: 1 },
      sheetRates: body.sheetRates || {
        base: { withoutFees: 0, withFees: 0 },
        hanging: { withoutFees: 0, withFees: 0 },
        tall: { withoutFees: 0, withFees: 0 },
      },
      cabinetTypeMultipliers: body.cabinetTypeMultipliers || { luxury: 1, premium: 0.9, basic: 0.8 },
    }
    const supabase = supabaseServer()
    await supabase.from("calculator_pricing").upsert({ id: "current", data: next, updated_at: new Date().toISOString() }, { onConflict: "id" })
    await supabase.from("calculator_pricing_versions").insert({ ts: Date.now(), data: next })
    return NextResponse.json({ ok: true, data: next })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
  }
}
