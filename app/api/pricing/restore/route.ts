import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import path from "path"
import { readFile } from "fs/promises"

export async function POST(req: Request) {
  try {
    let ts = 0
    try {
      const body = await req.json()
      ts = Number(body?.ts || 0)
    } catch {
      try {
        const txt = await req.text()
        if (txt) {
          const params = new URLSearchParams(txt)
          ts = Number(params.get("ts") || 0)
        }
      } catch {}
      if (!ts) {
        try {
          const fd = await req.formData()
          ts = Number(fd.get("ts") || 0)
        } catch {}
      }
    }
    if (!ts) return NextResponse.json({ ok: false, error: "Missing ts" }, { status: 400 })
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing_versions").select("data,ts").eq("ts", ts).single()
    let payload = data?.data
    if (!payload) {
      try {
        const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
        const txt = await readFile(versionsPath, "utf-8")
        const arr = JSON.parse(txt || "[]")
        const hit = (Array.isArray(arr) ? arr : []).find((v: any) => Number(v.ts) === ts)
        if (hit) payload = hit.data
      } catch {}
    }
    if (!payload) return NextResponse.json({ ok: false, error: "Version not found" }, { status: 404 })
    await supabase.from("calculator_pricing").upsert({ id: "current", data: payload, updated_at: new Date().toISOString() }, { onConflict: "id" })
    revalidatePath("/calculator")
    revalidatePath("/admin/calculator-pricing")
    return NextResponse.redirect(new URL("/admin/calculator-pricing", req.url))
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const ts = Number(url.searchParams.get("ts") || 0)
    if (!ts) return NextResponse.json({ ok: false, error: "Missing ts" }, { status: 400 })
    const supabase = supabaseServer()
    const { data } = await supabase.from("calculator_pricing_versions").select("data,ts").eq("ts", ts).single()
    let payload = data?.data
    if (!payload) {
      try {
        const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")
        const txt = await readFile(versionsPath, "utf-8")
        const arr = JSON.parse(txt || "[]")
        const hit = (Array.isArray(arr) ? arr : []).find((v: any) => Number(v.ts) === ts)
        if (hit) payload = hit.data
      } catch {}
    }
    if (!payload) return NextResponse.json({ ok: false, error: "Version not found" }, { status: 404 })
    await supabase.from("calculator_pricing").upsert({ id: "current", data: payload, updated_at: new Date().toISOString() }, { onConflict: "id" })
    revalidatePath("/calculator")
    revalidatePath("/admin/calculator-pricing")
    return NextResponse.redirect(new URL("/admin/calculator-pricing", req.url))
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
