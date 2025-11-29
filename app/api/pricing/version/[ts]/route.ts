import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(
  _req: Request,
  { params }: { params: { ts: string } }
) {
  try {
    const targetTs = Number(params.ts)
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing_versions").select("data,ts").eq("ts", targetTs).single()
    if (!data) return NextResponse.json({ error: "Version not found" }, { status: 404 })
    return NextResponse.json(data.data, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to read versions" }, { status: 500 })
  }
}
