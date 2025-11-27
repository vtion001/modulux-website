import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"

const crmPath = path.join(process.cwd(), "data", "crm.json")

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const name = String(payload?.name || "").trim()
    const email = String(payload?.email || "").trim()
    const phone = String(payload?.phone || "").trim()
    const company = String(payload?.company || "").trim()
    const source = String(payload?.source || "Inquiry").trim()
    const notes = String(payload?.notes || "").trim()
    await mkdir(path.join(process.cwd(), "data"), { recursive: true })
    const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
    const db = JSON.parse(raw || "{}") as any
    const leads = db.leads || []
    const id = `lead_${Date.now()}`
    leads.unshift({ id, name, email, phone, company, source, status: "New", notes, created_at: Date.now() })
    const next = { ...db, leads }
    await writeFile(crmPath, JSON.stringify(next, null, 2))
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}

