import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim()
    const phone = String(body?.phone || "").trim()
    const company = String(body?.company || "").trim()
    const source = String(body?.source || "Proposal").trim()
    const notes = String(body?.notes || "").trim()
    if (!name && !email) return NextResponse.json({ error: "Missing name or email" }, { status: 400 })
    const supabase = supabaseServer()
    const { data, error } = await supabase.from("leads").insert({ name, email, phone, company, source, status: "New", notes }).select("id").single()
    if (error) return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}
