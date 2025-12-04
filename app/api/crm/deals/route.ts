import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body?.title || "").trim()
    const contact_id = String(body?.contact_id || "").trim()
    const value = Number(body?.value || 0)
    const next_activity = String(body?.next_activity || "").trim()
    const due_date = String(body?.due_date || "").trim()
    if (!title || !contact_id) return NextResponse.json({ error: "Missing title or contact" }, { status: 400 })
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0
    const supabase = supabaseServer()
    const rec = { title, contact_id, value: safeValue, stage: "New", next_activity: next_activity || null, due_date: due_date || null }
    const { data, error } = await supabase.from("deals").insert(rec).select("id").single()
    if (error) return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}
