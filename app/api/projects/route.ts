import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile } from "fs/promises"

export async function GET() {
  try {
    try {
      const supabase = supabaseServer()
      const { data } = await supabase.from("projects").select("*").order("year", { ascending: false })
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data)
      }
    } catch {}

    const projectsPath = path.join(process.cwd(), "data", "projects.json")
    const raw = await readFile(projectsPath, "utf-8").catch(() => "[]")
    const local = JSON.parse(raw || "[]")
    const list = Array.isArray(local) ? local : []
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([])
  }
}
