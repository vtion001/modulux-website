import { NextResponse } from "next/server"
import path from "path"
import { mkdir, writeFile } from "fs/promises"
import { supabaseServer } from "@/lib/supabase-server"

const dataDir = path.join(process.cwd(), "data")

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const name = String(form.get("name") || "").trim()
    const email = String(form.get("email") || "").trim()
    const phone = String(form.get("phone") || "").trim()
    const message = String(form.get("message") || "").trim()
    const files = form.getAll("attachments")
    const ts = Date.now()
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })
    const saved: Array<{ url: string; name: string; type: string; size: number }> = []
    for (const f of files) {
      if (!(f instanceof File)) continue
      if (!f.size) continue
      const type = f.type || "application/octet-stream"
      if (!/(pdf|jpeg|jpg|png)/i.test(type)) continue
      const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")) : type.includes("pdf") ? ".pdf" : type.includes("png") ? ".png" : ".jpg"
      const fileName = `inquiry-${ts}-${Math.random().toString(36).slice(2)}${ext}`
      const dest = path.join(uploadsDir, fileName)
      const buffer = Buffer.from(await f.arrayBuffer())
      await writeFile(dest, buffer)
      saved.push({ url: `/uploads/${fileName}`, name: f.name, type, size: f.size })
    }
    const id = `inq_${ts}_${Math.random().toString(36).slice(2)}`
    const rec = { id, name, email, phone, message, attachments: saved, date: new Date(ts).toISOString(), status: "new", tags: [] }
    const supabase = supabaseServer()
    await supabase.from("inquiries").insert(rec)
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Failed to submit" }, { status: 400 })
  }
}
