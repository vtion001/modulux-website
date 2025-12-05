import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { mkdir, writeFile, readFile } from "fs/promises"

const dataDir = path.join(process.cwd(), "data")
const rfqHistoryPath = path.join(dataDir, "rfq-history.json")
const emailCfgPath = path.join(dataDir, "email.json")
const fabricatorsPath = path.join(dataDir, "fabricators.json")
const rfqUploadsDir = path.join(process.cwd(), "public", "uploads", "rfq")

async function addFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const install = Number(formData.get("install") || 0)
  if (!id || !name) return
  const supabase = supabaseServer()
  const item = { id, name, email, rates: { board_cut, edge_band, assembly, install }, history: [{ ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] }
  await supabase.from("fabricators").upsert(item, { onConflict: "id" })
  try {
    const raw = await readFile(fabricatorsPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = Array.isArray(prev) ? [item, ...prev.filter((f: any) => f.id !== id)] : [item]
    await mkdir(dataDir, { recursive: true })
    await writeFile(fabricatorsPath, JSON.stringify(next, null, 2))
  } catch {}
  revalidatePath("/admin/fabricators")
}

async function deleteFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const supabase = supabaseServer()
  await supabase.from("fabricators").delete().eq("id", id)
  try {
    const raw = await readFile(fabricatorsPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = Array.isArray(prev) ? prev.filter((f: any) => f.id !== id) : []
    await mkdir(dataDir, { recursive: true })
    await writeFile(fabricatorsPath, JSON.stringify(next, null, 2))
  } catch {}
  revalidatePath("/admin/fabricators")
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
    } catch {}
  }
  if (!email || (!plan && !profile)) return

  const attachments: Array<{ filename: string; content_base64: string; mime?: string }> = []
  const archivedPaths: string[] = []
  async function ensureBucket() {
    try {
      const { data: bucketInfo, error: getErr } = await supabase.storage.getBucket("rfq")
      if (!bucketInfo || getErr) {
        await supabase.storage.createBucket("rfq", { public: true })
      }
    } catch {}
  }
  async function uploadToStorage(key: string, bytes: Uint8Array): Promise<string | null> {
    try {
      await ensureBucket()
      const { error } = await supabase.storage.from("rfq").upload(key, bytes, { contentType: "application/pdf", upsert: false })
      if (error) return null
      const { data } = supabase.storage.from("rfq").getPublicUrl(key)
      return String(data?.publicUrl || "") || null
    } catch {
      return null
    }
  }
  async function pushFile(f: File | null, fallbackName: string) {
    if (!f || typeof f !== "object" || f.size === 0) return
    const ab = await f.arrayBuffer()
    const content_base64 = Buffer.from(ab).toString("base64")
    const filename = f.name || fallbackName
    attachments.push({ filename, content_base64, mime: "application/pdf" })
    try {
      const ext = filename.toLowerCase().endsWith(".pdf") ? ".pdf" : (filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : ".pdf")
      const safe = `${fabricator_id || "rfq"}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const buf = new Uint8Array(ab)
      const storageUrl = await uploadToStorage(safe, buf)
      if (storageUrl) {
        archivedPaths.push(storageUrl)
      } else {
        await mkdir(rfqUploadsDir, { recursive: true })
        const dest = path.join(rfqUploadsDir, safe)
        await writeFile(dest, Buffer.from(ab))
        archivedPaths.push(`/uploads/rfq/${safe}`)
      }
    } catch {}
  }
  await pushFile(plan, "cabinet-plan.pdf")
  await pushFile(profile, "fabricator-profile.pdf")

  const subject = "Request for Quotation — Cabinet Plan"
  const cfgRaw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(cfgRaw || "{}")
  const template = String(cfg?.rfq_template_text || "")
  const defaultText = `Hello${fname ? ` ${fname}` : ""},\n\nPlease find the attached cabinet plan${plan ? " (PDF)" : ""}${profile ? " and fabricator profile (PDF)" : ""}. Kindly provide your quotation at your earliest convenience.\n\nThank you.\n`
  const text = (message || template || defaultText)

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
    const next = Array.isArray(prev) ? [event, ...prev] : [event]
    await mkdir(dataDir, { recursive: true })
    await writeFile(rfqHistoryPath, JSON.stringify(next, null, 2))
    try {
      const rid = `${fabricator_id || 'rfq'}-${Date.now()}`
      await supabase.from('fabricator_rfqs').upsert({
        id: rid,
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
    } catch {}
    revalidatePath("/admin/fabricators")
    return { ok }
  } catch {
    return { ok: false }
  }
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
    try {
      const raw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
      const prev = JSON.parse(raw || "[]")
      record = Array.isArray(prev) ? prev.find((e: any) => Number(e.ts) === ts) : null
    } catch {}
  }
  if (!record) return { ok: false }
  const to = String(record.to_email || record.to || "").trim()
  const fname = String(record.name || "").trim()
  const subject = String(record.subject || "RFQ").trim()
  const text = String(record.message || "").trim()
  const files = Array.isArray(record.files) ? record.files : []
  const names = Array.isArray(record.attachments) ? record.attachments : []
  const attachments: Array<{ filename: string; content_base64: string; mime?: string }> = []
  for (let i = 0; i < files.length; i++) {
    const url = String(files[i] || "")
    const name = String(names[i] || `attachment_${i + 1}.pdf`)
    if (!url) continue
    try {
      if (url.startsWith("http")) {
        const res = await fetch(url)
        const ab = await res.arrayBuffer()
        attachments.push({ filename: name, content_base64: Buffer.from(ab).toString("base64"), mime: "application/pdf" })
      } else {
        const rel = url.startsWith("/") ? url.slice(1) : url
        const full = path.join(process.cwd(), rel)
        const buf = await (await import("fs/promises")).readFile(full).catch(() => null)
        if (buf) attachments.push({ filename: name, content_base64: Buffer.from(buf).toString("base64"), mime: "application/pdf" })
      }
    } catch {}
  }
  if (!to || attachments.length === 0) return { ok: false }
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ""
    const res = await fetch(`${base}/api/gmail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text, attachments }),
    })
    const ok = res.ok
    const data = await res.json().catch(() => ({}))
    const event = { ts: Date.now(), ok, fabricator_id: String(record.fabricator_id || ""), to, name: fname, subject, gmail_id: String(data?.id || ""), attachments: names, files }
    const raw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
    const prev = JSON.parse(raw || "[]")
    const next = Array.isArray(prev) ? [event, ...prev] : [event]
    await mkdir(dataDir, { recursive: true })
    await writeFile(rfqHistoryPath, JSON.stringify(next, null, 2))
    try {
      const rid = `${record.fabricator_id || 'rfq'}-${Date.now()}`
      await supabase.from('fabricator_rfqs').upsert({
        id: rid,
        fabricator_id: String(record.fabricator_id || ""),
        to_email: to,
        name: fname,
        subject,
        message: text,
        ok,
        gmail_id: String(data?.id || ""),
        attachments: names,
        files,
        ts: Date.now(),
      }, { onConflict: 'id' })
    } catch {}
    revalidatePath("/admin/fabricators")
    return { ok }
  } catch {
    return { ok: false }
  }
}

async function updateEmailTemplate(formData: FormData) {
  "use server"
  const rfqText = String(formData.get("rfq_template_text") || "")
  const raw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw || "{}")
  const next = { ...cfg, rfq_template_text: rfqText }
  await mkdir(dataDir, { recursive: true })
  await writeFile(emailCfgPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/fabricators")
}

export default async function AdminFabricatorsPage() {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase.from("fabricators").select("*").order("name")
  let list = listRaw || []
  if (!Array.isArray(list) || list.length === 0) {
    const rawLocal = await readFile(fabricatorsPath, "utf-8").catch(() => "[]")
    const local = JSON.parse(rawLocal || "[]")
    list = Array.isArray(local) ? local : []
  }
  const rfqRaw = await readFile(rfqHistoryPath, "utf-8").catch(() => "[]")
  const rfqEvents = JSON.parse(rfqRaw || "[]")
  const lastById: Record<string, any> = {}
  if (Array.isArray(rfqEvents)) {
    for (const e of rfqEvents) {
      const fid = String(e.fabricator_id || "")
      if (!fid) continue
      const prev = lastById[fid]
      if (!prev || Number(e.ts || 0) > Number(prev.ts || 0)) lastById[fid] = e
    }
  }
  let rfqs: any[] = []
  try {
    const { data: rows } = await supabase.from('fabricator_rfqs').select('*').order('ts', { ascending: false })
    rfqs = rows || []
  } catch {}
  if (!Array.isArray(rfqs) || rfqs.length === 0) {
    rfqs = Array.isArray(rfqEvents) ? rfqEvents.slice().sort((a:any,b:any)=>Number(b.ts)-Number(a.ts)) : []
  }
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fabricators</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Manage third-party fabricator cost profiles and rates</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 text-sm">Total: {list.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Add Fabricator</h2>
            <SaveForm action={addFabricator} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-id">ID</label>
                <input id="fab-id" name="id" placeholder="fab_123" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-name">Name</label>
                <input id="fab-name" name="name" placeholder="Acme Fabrication" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-email">Email</label>
                <input id="fab-email" name="email" type="email" placeholder="fabricator@example.com" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-board">Board cutting</label>
                <input id="fab-board" name="board_cut" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-edge">Edge banding</label>
                <input id="fab-edge" name="edge_band" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-assembly">Assembly</label>
                <input id="fab-assembly" name="assembly" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="md:col-span-5">
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-install">Installation</label>
                <input id="fab-install" name="install" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="md:col-span-5">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]" aria-label="Add fabricator">
                  Add
                </button>
              </div>
            </SaveForm>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Send RFQ (attach plan/profile PDF)</h3>
              <SaveForm action={sendRFQ} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-fid">Fabricator</label>
                  <select id="rfq-fid" name="fabricator_id" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select a fabricator</option>
                    {list.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-email">Fabricator Email</label>
                  <input id="rfq-email" name="email" type="email" placeholder="fabricator@example.com" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-name">Fabricator Name (optional)</label>
                  <input id="rfq-name" name="name" placeholder="Acme Fabrication" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-plan">Cabinet Plan (PDF)</label>
                  <input id="rfq-plan" name="plan_pdf" type="file" accept="application/pdf" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-profile">Fabricator Profile (PDF)</label>
                  <input id="rfq-profile" name="profile_pdf" type="file" accept="application/pdf" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="rfq-message">Message</label>
                  <textarea id="rfq-message" name="message" placeholder="Write a short request for quotation…" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="md:col-span-5">
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]" aria-label="Send RFQ">
                    Send RFQ
                  </button>
                </div>
              </SaveForm>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Fabricators</h2>
            <div className="grid grid-cols-1 gap-3">
              {list.map((f) => (
                <div key={f.id} className="rounded-xl border border-border/40 p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-foreground">{f.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Board cut: {f?.rates?.board_cut || 0}</div>
                    <div>Edge band: {f?.rates?.edge_band || 0}</div>
                    <div>Assembly: {f?.rates?.assembly || 0}</div>
                    <div>Install: {f?.rates?.install || 0}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div>Email: {f?.email || "—"}</div>
                    {lastById[f.id] && (
                      <div>Last RFQ: {new Date(lastById[f.id].ts).toLocaleString()} • {lastById[f.id].ok ? "Sent" : "Failed"}</div>
                    )}
                    {lastById[f.id]?.files && Array.isArray(lastById[f.id].files) && lastById[f.id].files.length > 0 && (
                      <div className="mt-1">Files: {lastById[f.id].files.map((p: string, i: number) => (
                        <a key={p} href={p} className="underline mr-2" target="_blank" rel="noreferrer">File {i+1}</a>
                      ))}</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" href={`/admin/fabricators/${f.id}`} aria-label={`Edit ${f.name}`}>
                      Edit
                    </a>
                    <SaveForm action={deleteFabricator}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" aria-label={`Delete ${f.name}`}>
                        Delete
                      </button>
                    </SaveForm>
                    <details className="text-sm">
                      <summary className="cursor-pointer px-3 py-2 rounded-md border">Quick RFQ</summary>
                      <div className="mt-2 p-2 border rounded-md">
                        <SaveForm action={sendRFQ} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input type="hidden" name="fabricator_id" value={f.id} />
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Cabinet Plan (PDF)</label>
                            <input name="plan_pdf" type="file" accept="application/pdf" className="w-full p-2 border rounded" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Profile (PDF)</label>
                            <input name="profile_pdf" type="file" accept="application/pdf" className="w-full p-2 border rounded" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs text-muted-foreground block mb-1">Message</label>
                            <input name="message" placeholder="Short message (optional)" className="w-full p-2 border rounded" />
                          </div>
                          <div className="md:col-span-4">
                            <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">Send RFQ</button>
                          </div>
                        </SaveForm>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <div className="text-sm text-muted-foreground">No fabricators yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Guidelines</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Use unique IDs to prevent conflicts.</li>
              <li>All rates should be per job or per meter basis.</li>
              <li>Update history is stored automatically for audit.</li>
            </ul>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">RFQ Message Template</h3>
              <SaveForm action={updateEmailTemplate} className="space-y-2">
                <textarea name="rfq_template_text" placeholder="Default RFQ email body…" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SubmitButton confirm="Save template?" className="px-3 py-2 rounded-md border text-sm">Save Template</SubmitButton>
              </SaveForm>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent RFQs</h2>
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-2">Fabricator</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs.slice(0, 20).map((e: any) => (
                    <tr key={`${e.gmail_id || e.ts}-${e.to_email || e.to}`} className="border-t">
                      <td className="p-2">{e.name || (list.find((f:any)=>String(f.id)===String(e.fabricator_id))?.name) || e.fabricator_id || "—"}</td>
                      <td className="p-2">{e.to_email || e.to || "—"}</td>
                      <td className="p-2">{e.subject || "RFQ"}</td>
                      <td className="p-2">{e.ok ? "Sent" : "Failed"}</td>
                      <td className="p-2">{new Date(Number(e.ts) || Date.now()).toLocaleString()}</td>
                      <td className="p-2">
                        {Array.isArray(e.files) && e.files.length > 0 ? e.files.map((p: string, i: number) => (
                          <a key={`${p}-${i}`} href={p} className="underline mr-2" target="_blank" rel="noreferrer">File {i+1}</a>
                        )) : "—"}
                        <div className="mt-1 inline-block">
                          <SaveForm action={resendRFQ}>
                            {e.id ? <input type="hidden" name="event_id" value={e.id} /> : null}
                            {!e.id ? <input type="hidden" name="ts" value={String(e.ts||"")} /> : null}
                            <button className="px-2 py-1 rounded border text-xs">Resend</button>
                          </SaveForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rfqs.length === 0 && (
                    <tr><td className="p-3 text-muted-foreground" colSpan={6}>No RFQs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
