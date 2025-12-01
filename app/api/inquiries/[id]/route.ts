import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

const filePath = ""

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const payload = await req.json()
    const supabase = supabaseServer()
    const { data: prev } = await supabase.from("inquiries").select("*").eq("id", id).single()
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const next: any = { ...prev }
    if (typeof payload.status === "string") next.status = payload.status
    if (Array.isArray(payload.tags)) next.tags = payload.tags
    if (payload.appendTag && typeof payload.appendTag === "string") next.tags = Array.from(new Set([...(next.tags || []), payload.appendTag]))
    if (payload.note && typeof payload.note === "string") {
      next.notes = Array.isArray(prev.notes) ? [...prev.notes, { text: payload.note, date: new Date().toISOString() }] : [{ text: payload.note, date: new Date().toISOString() }]
    }
    await supabase.from("inquiries").update(next).eq("id", id)
    return NextResponse.json({ ok: true, inquiry: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update" }, { status: 400 })
  }
}
