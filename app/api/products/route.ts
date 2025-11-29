import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

const filePath = ""

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (id) {
      const supabase = supabaseServer()
      const { data: item } = await supabase.from("products").select("*").eq("id", id).single()
      return NextResponse.json({ item: item || null })
    }
    const supabase = supabaseServer()
    const { data: items } = await supabase.from("products").select("*").order("name")
    return NextResponse.json({ items: items || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}
