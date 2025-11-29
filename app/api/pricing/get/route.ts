import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing").select("data").eq("id", "current").single()
    const payload = (data?.data) || null
    if (!payload) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    return NextResponse.json(payload, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to read pricing" }, { status: 500 })
  }
}

