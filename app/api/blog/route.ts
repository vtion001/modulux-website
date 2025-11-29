import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from("blog_posts").select("*").order("date", { ascending: false })
    return NextResponse.json(data || [])
  } catch (e) {
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 })
  }
}
