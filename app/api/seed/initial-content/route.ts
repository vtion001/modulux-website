import { NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const [projectsRaw, blogRaw, productsRaw] = await Promise.all([
      readFile(path.join(dataDir, "projects.json"), "utf-8").catch(() => "[]"),
      readFile(path.join(dataDir, "blog.json"), "utf-8").catch(() => "[]"),
      readFile(path.join(dataDir, "products.json"), "utf-8").catch(() => "[]"),
    ])
    const projects = JSON.parse(projectsRaw || "[]") as any[]
    const blog = (JSON.parse(blogRaw || "[]") as any[]).map((p) => ({ ...p, read_time: p.readTime || p.read_time || "" }))
    const products = JSON.parse(productsRaw || "[]") as any[]

    const supabase = supabaseServer()
    let projectsSeeded = 0
    let blogSeeded = 0
    let productsSeeded = 0
    if (projects.length) {
      const { error } = await supabase.from("projects").upsert(projects, { onConflict: "id", ignoreDuplicates: false })
      if (error) throw error
      projectsSeeded = projects.length
    }
    if (blog.length) {
      const { error } = await supabase.from("blog_posts").upsert(blog, { onConflict: "id", ignoreDuplicates: false })
      if (error) throw error
      blogSeeded = blog.length
    }
    if (products.length) {
      const { error } = await supabase.from("products").upsert(products, { onConflict: "id", ignoreDuplicates: false })
      if (error) throw error
      productsSeeded = products.length
    }
    return NextResponse.json({ ok: true, projectsSeeded, blogSeeded, productsSeeded })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Seed failed" }, { status: 500 })
  }
}
