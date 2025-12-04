import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = String(url.searchParams.get("q") || "").trim()
    const sort = String(url.searchParams.get("sort") || "updated_desc")
    const page = Math.max(1, Number(url.searchParams.get("page") || 1))
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") || 10))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const supabase = supabaseServer()
    let query = supabase
      .from("proposal_drafts")
      .select("id,data,created_at,updated_at", { count: "exact" })
    if (q) {
      const esc = q.replace(/%/g, "")
      query = query.or(`data->>title.ilike.%${esc}%,data->client->>name.ilike.%${esc}%,data->client->>email.ilike.%${esc}%`)
    }
    let col = "updated_at"
    let asc = true
    if (sort === "updated_desc") asc = false
    else if (sort === "updated_asc") asc = true
    else if (sort === "title_asc") { col = "data->>title"; asc = true }
    else if (sort === "title_desc") { col = "data->>title"; asc = false }
    else if (sort === "client_asc") { col = "data->client->>name"; asc = true }
    else if (sort === "client_desc") { col = "data->client->>name"; asc = false }
    query = query.order(col as any, { ascending: asc, nullsFirst: true })
    query = query.range(from, to)
    const { data, count } = await query
    const drafts = (data || []).map((row: any) => ({ id: row.id, ...(row.data || {}), created_at: row.created_at, updated_at: row.updated_at }))
    return NextResponse.json({ drafts, total: count || drafts.length, page, pageSize })
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
      crmId: String(body?.crmId || ""),
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || "")
    const title = String(body?.title || "")
    if (!id || !title) return NextResponse.json({ ok: false, error: "Missing id or title" }, { status: 400 })
    const supabase = supabaseServer()
    const { data } = await supabase.from("proposal_drafts").select("data").eq("id", id).single()
    const current = (data?.data || {}) as any
    const next = { ...current, title }
    await supabase.from("proposal_drafts").upsert({ id, data: next, updated_at: new Date().toISOString() }, { onConflict: "id" })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
