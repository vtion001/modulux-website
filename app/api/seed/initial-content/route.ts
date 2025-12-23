import { NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    const [projectsRaw, blogRaw, productsRaw, subcontractorsRaw] = await Promise.all([
      readFile(path.join(dataDir, "projects.json"), "utf-8").catch(() => "[]"),
      readFile(path.join(dataDir, "blog.json"), "utf-8").catch(() => "[]"),
      readFile(path.join(dataDir, "products.json"), "utf-8").catch(() => "[]"),
      readFile(path.join(dataDir, "subcontractors.json"), "utf-8").catch(() => "[]"),
    ])
    const projects = JSON.parse(projectsRaw || "[]") as any[]
    const blog = (JSON.parse(blogRaw || "[]") as any[]).map((p) => {
      const { readTime, ...rest } = p
      return { ...rest, read_time: readTime || p.read_time || "" }
    })
    const products = JSON.parse(productsRaw || "[]") as any[]
    const subcontractors = JSON.parse(subcontractorsRaw || "[]") as any[]

    const supabase = supabaseServer()
    let projectsSeeded = 0
    let blogSeeded = 0
    let productsSeeded = 0
    let subcontractorsSeeded = 0
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
    if (subcontractors.length) {
      const { error } = await supabase.from("subcontractors").upsert(subcontractors, { onConflict: "id", ignoreDuplicates: false })
      if (error) throw error
      subcontractorsSeeded = subcontractors.length
    }
    return NextResponse.json({ ok: true, projectsSeeded, blogSeeded, productsSeeded, subcontractorsSeeded })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Seed failed" }, { status: 500 })
  }
}
