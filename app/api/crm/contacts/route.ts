import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const [{ data: contactsRaw }, { data: leadsRaw }, { data: clientsRaw }] = await Promise.all([
      supabase.from("contacts").select("id,name,email,phone,company,tags,created_at").order("created_at", { ascending: false }),
      supabase.from("leads").select("id,name,email,phone,company,source,status,created_at").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name,status,service,source,created_at").order("created_at", { ascending: false }),
    ])
    const contacts = contactsRaw || []
    const leads = (leadsRaw || []).map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: ["Lead", l.status || ""].filter(Boolean), created_at: l.created_at }))
    const clients = clientsRaw || []
    if ((contacts?.length || 0) + (leads?.length || 0) + (clients?.length || 0) === 0) {
      try {
        const filePath = path.join(process.cwd(), "data", "crm.json")
        const txt = await fs.readFile(filePath, "utf-8")
        const db = JSON.parse(txt)
        const contactsLocal = Array.isArray(db?.contacts) ? db.contacts : []
        const leadsLocal = (Array.isArray(db?.leads) ? db.leads : []).map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: ["Lead", l.status || ""].filter(Boolean), created_at: l.created_at }))
        return NextResponse.json({ contacts: contactsLocal, leads: leadsLocal, clients: [] }, { status: 200 })
      } catch {}
    }
    return NextResponse.json({ contacts: contacts, leads: leads, clients: clients }, { status: 200 })
  } catch (e) {
    try {
      const filePath = path.join(process.cwd(), "data", "crm.json")
      const txt = await fs.readFile(filePath, "utf-8")
      const db = JSON.parse(txt)
      const contactsLocal = Array.isArray(db?.contacts) ? db.contacts : []
      const leadsLocal = (Array.isArray(db?.leads) ? db.leads : []).map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: ["Lead", l.status || ""].filter(Boolean), created_at: l.created_at }))
      return NextResponse.json({ contacts: contactsLocal, leads: leadsLocal, clients: [] }, { status: 200 })
    } catch {
      return NextResponse.json({ error: "Failed to fetch CRM contacts" }, { status: 500 })
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim()
    const phone = String(body?.phone || "").trim()
    const company = String(body?.company || "").trim()
    if (!name && !email) return NextResponse.json({ error: "Missing name or email" }, { status: 400 })
    const id = `ct_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const rec = { id, name, email, phone, company, tags: [], created_at: new Date().toISOString() }
    const supabase = supabaseServer()
    await supabase.from("contacts").insert(rec)
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create" }, { status: 400 })
  }
}
