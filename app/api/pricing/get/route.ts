import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile } from "fs/promises"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing").select("data").eq("id", "current").single()
    const payload = (data?.data) || null
    if (!payload) {
      try {
        const p = path.join(process.cwd(), "data", "calculator-pricing.json")
        const txt = await readFile(p, "utf-8")
        const fallback = JSON.parse(txt)
        return NextResponse.json(fallback, { status: 200 })
      } catch {}
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(payload, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to read pricing" }, { status: 500 })
  }
}
