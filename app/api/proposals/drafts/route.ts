import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data } = await supabase
      .from("proposal_drafts")
      .select("id,data,created_at,updated_at")
      .order("updated_at", { ascending: false })
    const drafts = (data || []).map((row: any) => ({ id: row.id, ...(row.data || {}), created_at: row.created_at, updated_at: row.updated_at }))
    return NextResponse.json({ drafts })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load drafts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || `draft_${Date.now()}`)
    const payload = {
      client: body?.client || { name: "", email: "", company: "" },
      title: String(body?.title || "Proposal"),
      items: Array.isArray(body?.items) ? body.items : [],
      taxRate: Number(body?.taxRate || 0),
      discount: Number(body?.discount || 0),
      notes: String(body?.notes || ""),
    }
    const supabase = supabaseServer()
    await supabase
      .from("proposal_drafts")
      .upsert({ id, data: payload, updated_at: new Date().toISOString() }, { onConflict: "id" })
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || "")
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = supabaseServer()
    await supabase.from("proposal_drafts").delete().eq("id", id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
