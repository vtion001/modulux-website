import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { mkdir, writeFile, readFile } from "fs/promises"
import { SubcontractorManager } from "./subcontractor-manager"

const dataDir = path.join(process.cwd(), "data")
const rfqHistoryPath = path.join(dataDir, "rfq-history.json")
const emailCfgPath = path.join(dataDir, "email.json")
const subcontractorsJsonPath = path.join(dataDir, "fabricators.json")
const rfqUploadsDir = path.join(process.cwd(), "public", "uploads", "rfq")

async function addSubcontractor(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const design = Number(formData.get("design") || 0)
  const install = Number(formData.get("install") || 0)
  const countertop = Number(formData.get("countertop") || 0)

  const unit_board_cut = String(formData.get("unit_board_cut") || "per job")
  const unit_edge_band = String(formData.get("unit_edge_band") || "per job")
  const unit_assembly = String(formData.get("unit_assembly") || "per job")
  const unit_design = String(formData.get("unit_design") || "per job")
  const unit_install = String(formData.get("unit_install") || "per job")
  const unit_countertop = String(formData.get("unit_countertop") || "per job")

  const category = String(formData.get("category") || "").trim()
  const notes = String(formData.get("notes") || "").trim()
  if (!id || !name) return
  const supabase = supabaseServer()
  const item = {
    id,
    name,
    email,
    phone,
    category,
    notes,
    rates: { board_cut, edge_band, assembly, design, install, countertop },
    units: {
      board_cut: unit_board_cut,
      edge_band: unit_edge_band,
      assembly: unit_assembly,
      design: unit_design,
      install: unit_install,
      countertop: unit_countertop
    },
    history: [{
      ts: Date.now(),
      rates: { board_cut, edge_band, assembly, design, install, countertop },
      units: {
        board_cut: unit_board_cut,
        edge_band: unit_edge_band,
        assembly: unit_assembly,
        design: unit_design,
        install: unit_install,
        countertop: unit_countertop
      }
    }]
  }

  await supabase.from("fabricators").upsert(item, { onConflict: "id" })

  try {
    const raw = await readFile(subcontractorsJsonPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = Array.isArray(prev) ? [item, ...prev.filter((f: any) => f.id !== id)] : [item]
    await mkdir(dataDir, { recursive: true })
    await writeFile(subcontractorsJsonPath, JSON.stringify(next, null, 2))
  } catch { }
  revalidatePath("/admin/subcontractors")
}

async function deleteSubcontractor(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const supabase = supabaseServer()
  await supabase.from("fabricators").delete().eq("id", id)
  try {
    const raw = await readFile(subcontractorsJsonPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = Array.isArray(prev) ? prev.filter((f: any) => f.id !== id) : []
    await mkdir(dataDir, { recursive: true })
    await writeFile(subcontractorsJsonPath, JSON.stringify(next, null, 2))
  } catch { }
  revalidatePath("/admin/subcontractors")
}

async function sendRFQ(formData: FormData) {
  "use server"
  const fabricator_id = String(formData.get("fabricator_id") || "").trim()
  const to = String(formData.get("email") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const message = String(formData.get("message") || "").trim()
  const plan = formData.get("plan_pdf") as File | null
  const profile = formData.get("profile_pdf") as File | null
  let email = to
  let fname = name
  const supabase = supabaseServer()
  if (!email && fabricator_id) {
    try {
      const { data: fab } = await supabase.from("fabricators").select("*").eq("id", fabricator_id).single()
      email = String((fab as any)?.email || "").trim()
      fname = fname || String((fab as any)?.name || "").trim()
    } catch { }
  }
  if (!email || (!plan && !profile)) return

  const attachments: any[] = []
  const archivedPaths: string[] = []

  async function uploadToStorage(key: string, bytes: Uint8Array): Promise<string | null> {
    try {
      const { error } = await supabase.storage.from("rfq").upload(key, bytes, { contentType: "application/pdf", upsert: false })
      if (error) return null
      const { data } = supabase.storage.from("rfq").getPublicUrl(key)
      return String(data?.publicUrl || "") || null
    } catch { return null }
  }

  async function pushFile(f: File | null, fallbackName: string) {
    if (!f || typeof f !== "object" || f.size === 0) return
    const ab = await f.arrayBuffer()
    const content_base64 = Buffer.from(ab).toString("base64")
    const filename = f.name || fallbackName
    attachments.push({ filename, content_base64, mime: "application/pdf" })
    try {
      const safe = `${fabricator_id || "rfq"}-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
      const storageUrl = await uploadToStorage(safe, new Uint8Array(ab))
      if (storageUrl) archivedPaths.push(storageUrl)
    } catch { }
  }

  await pushFile(plan, "cabinet-plan.pdf")
  await pushFile(profile, "subcontractor-profile.pdf")

  const subject = "Request for Quotation — Cabinet Plan"
  const cfgRaw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(cfgRaw || "{}")
  const text = message || String(cfg?.rfq_template_text || "") || "Please find the attached cabinet plan and profile."

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ""
    const res = await fetch(`${base}/api/gmail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, subject, text, attachments }),
    })
    const ok = res.ok
    const data = await res.json().catch(() => ({}))
    const event = { ts: Date.now(), ok, fabricator_id, to: email, name: fname, subject, gmail_id: String(data?.id || ""), attachments: attachments.map(a => a.filename), files: archivedPaths }
    const raw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = [event, ...prev]
    await writeFile(rfqHistoryPath, JSON.stringify(next, null, 2))

    await supabase.from('fabricator_rfqs').upsert({
      id: `${fabricator_id || 'rfq'}-${Date.now()}`,
      fabricator_id,
      to_email: email,
      name: fname,
      subject,
      message: text,
      ok,
      gmail_id: String(data?.id || ""),
      attachments: attachments.map(a => a.filename),
      files: archivedPaths,
      ts: Date.now(),
    }, { onConflict: 'id' })

    revalidatePath("/admin/subcontractors")
    return { ok }
  } catch { return { ok: false } }
}

async function resendRFQ(formData: FormData) {
  "use server"
  const event_id = String(formData.get("event_id") || "").trim()
  const ts = Number(formData.get("ts") || 0)
  const supabase = supabaseServer()
  let record: any = null
  if (event_id) {
    const { data } = await supabase.from("fabricator_rfqs").select("*").eq("id", event_id).single()
    record = data || null
  }
  if (!record && ts) {
    const raw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    record = prev.find((e: any) => Number(e.ts) === ts)
  }
  if (!record) return { ok: false }

  const to = String(record.to_email || record.to || "").trim()
  const files = Array.isArray(record.files) ? record.files : []
  const names = Array.isArray(record.attachments) ? record.attachments : []
  const attachments: any[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const res = await fetch(files[i])
      const ab = await res.arrayBuffer()
      attachments.push({ filename: names[i] || "file.pdf", content_base64: Buffer.from(ab).toString("base64"), mime: "application/pdf" })
    } catch { }
  }

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ""
    const res = await fetch(`${base}/api/gmail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject: record.subject, text: record.message, attachments }),
    })
    revalidatePath("/admin/subcontractors")
    return { ok: res.ok }
  } catch { return { ok: false } }
}

async function saveSubcontractor(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const rates = {
    board_cut: Number(formData.get("board_cut") || 0),
    edge_band: Number(formData.get("edge_band") || 0),
    assembly: Number(formData.get("assembly") || 0),
    design: Number(formData.get("design") || 0),
    install: Number(formData.get("install") || 0),
    countertop: Number(formData.get("countertop") || 0),
  }
  const units = {
    board_cut: String(formData.get("unit_board_cut") || "per job"),
    edge_band: String(formData.get("unit_edge_band") || "per job"),
    assembly: String(formData.get("unit_assembly") || "per job"),
    design: String(formData.get("unit_design") || "per job"),
    install: String(formData.get("unit_install") || "per job"),
    countertop: String(formData.get("unit_countertop") || "per job"),
  }
  const category = String(formData.get("category") || "").trim()
  const notes = String(formData.get("notes") || "").trim()

  const supabase = supabaseServer()
  const { data: prev } = await supabase.from("fabricators").select("*").eq("id", id).single()
  if (!prev) return

  const history = [...(prev.history || []), { ts: Date.now(), rates, units }]
  await supabase.from("fabricators").update({ name, email, phone, category, notes, rates, units, history }).eq("id", id)

  try {
    const raw = await readFile(subcontractorsJsonPath, "utf-8").catch(() => "[]")
    const local = JSON.parse(raw || "[]")
    const next = local.map((f: any) => f.id === id ? { ...f, name, email, phone, category, notes, rates, units, history } : f)
    await writeFile(subcontractorsJsonPath, JSON.stringify(next, null, 2))
  } catch { }
  revalidatePath("/admin/subcontractors")
}

async function updateEmailTemplate(formData: FormData) {
  "use server"
  const rfqText = String(formData.get("rfq_template_text") || "")
  const raw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw || "{}")
  const next = { ...cfg, rfq_template_text: rfqText }
  await writeFile(emailCfgPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/subcontractors")
}

export default async function AdminSubcontractorsPage() {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase.from("fabricators").select("*").order("name")
  let list = listRaw || []

  // Local merge
  const rawLocal = await readFile(subcontractorsJsonPath, "utf-8").catch(() => "[]")
  const local = JSON.parse(rawLocal || "[]")
  const localMap = new Map(local.map((item: any) => [item.id, item]))

  list = list.map((f: any) => {
    const l = localMap.get(f.id) as any
    if (l) return {
      ...l,
      ...f,
      rates: { ...(l.rates || {}), ...(f.rates || {}) },
      units: { ...(l.units || {}), ...(f.units || {}) }
    } as any
    return f
  })

  const existingIds = new Set(list.map((f: any) => f.id))
  for (const item of local) { if (!existingIds.has(item.id)) list.push(item) }
  list.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)))

  const rfqRaw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
  const rfqEvents = JSON.parse(rfqRaw || "[]")
  const lastById: any = {}
  for (const e of rfqEvents) {
    if (!e.fabricator_id) continue
    if (!lastById[e.fabricator_id] || e.ts > lastById[e.fabricator_id].ts) lastById[e.fabricator_id] = e
  }

  let rfqs: any[] = []
  try {
    const { data: rows } = await supabase.from('fabricator_rfqs').select('*').order('ts', { ascending: false })
    rfqs = rows || []
  } catch { }
  if (rfqs.length === 0) rfqs = rfqEvents.sort((a: any, b: any) => b.ts - a.ts)

  return (
    <SubcontractorManager
      initialList={list}
      initialRfqs={rfqs}
      lastById={lastById}
      saveAction={saveSubcontractor}
      addAction={addSubcontractor}
      deleteAction={deleteSubcontractor}
      sendAction={sendRFQ}
      resendAction={resendRFQ}
      updateTemplateAction={updateEmailTemplate}
    />
  )
}
