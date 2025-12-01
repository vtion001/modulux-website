import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile } from "fs/promises"

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
  } catch {}
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
