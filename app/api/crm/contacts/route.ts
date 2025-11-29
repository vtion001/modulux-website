import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = supabaseServer()
    const [{ data: contactsRaw }, { data: leadsRaw }] = await Promise.all([
      supabase.from("contacts").select("id,name,email,phone,company,tags,created_at").order("created_at", { ascending: false }),
      supabase.from("leads").select("id,name,email,phone,company,source,status,created_at").order("created_at", { ascending: false }),
    ])
    const contacts = contactsRaw || []
    const leads = (leadsRaw || []).map((l: any) => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, tags: ["Lead", l.status || ""].filter(Boolean), created_at: l.created_at }))
    return NextResponse.json({ contacts: contacts, leads: leads }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch CRM contacts" }, { status: 500 })
  }
}

