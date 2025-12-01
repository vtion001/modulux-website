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
