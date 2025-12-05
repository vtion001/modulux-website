import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile } from "fs/promises"

export async function GET() {
  try {
    try {
      const supabase = supabaseServer()
      const { data } = await supabase.from("blog_posts").select("*").order("date", { ascending: false })
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data)
      }
    } catch {}

    const blogPath = path.join(process.cwd(), "data", "blog_posts.json")
    const raw = await readFile(blogPath, "utf-8").catch(() => "[]")
    const local = JSON.parse(raw || "[]")
    const list = Array.isArray(local) ? local : []
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([])
  }
}
