import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"

const crmPath = path.join(process.cwd(), "data", "crm.json")

async function addLead(prev: any, formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const company = String(formData.get("company") || "").trim()
  const source = String(formData.get("source") || "Inbound").trim()
  const notes = String(formData.get("notes") || "").trim()
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const leads = db.leads || []
  const id = `lead_${Date.now()}`
  leads.unshift({ id, name, email, phone, company, source, status: "New", notes, created_at: Date.now() })
  const next = { ...db, leads }
  await writeFile(crmPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/crm")
  return { ok: true }
}

async function addDeal(prev: any, formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const title = String(formData.get("title") || "").trim()
  const contactId = String(formData.get("contact_id") || "").trim()
  const value = Number(formData.get("value") || 0)
  const nextActivity = String(formData.get("next_activity") || "").trim()
  const dueDate = String(formData.get("due_date") || "").trim()
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const deals = db.deals || []
  const id = `deal_${Date.now()}`
  deals.unshift({ id, title, contactId, value, stage: "New", nextActivity, dueDate, created_at: Date.now() })
  const next = { ...db, deals }
  await writeFile(crmPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/crm")
  return { ok: true }
}

async function addContact(prev: any, formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const name = String(formData.get("c_name") || "").trim()
  const email = String(formData.get("c_email") || "").trim()
  const phone = String(formData.get("c_phone") || "").trim()
  const company = String(formData.get("c_company") || "").trim()
  const tagsStr = String(formData.get("c_tags") || "").trim()
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : []
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const contacts = db.contacts || []
  const id = `contact_${Date.now()}`
  contacts.unshift({ id, name, email, phone, company, tags, created_at: Date.now() })
  const next = { ...db, contacts }
  await writeFile(crmPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/crm")
  return { ok: true }
}

async function updateLeadStatus(prev: any, formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const id = String(formData.get("id") || "")
  const status = String(formData.get("status") || "New")
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const leads = (db.leads || []).map((l: any) => (l.id === id ? { ...l, status } : l))
  await writeFile(crmPath, JSON.stringify({ ...db, leads }, null, 2))
  revalidatePath("/admin/crm")
  return { ok: true }
}

async function updateDealStage(prev: any, formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const id = String(formData.get("id") || "")
  const stage = String(formData.get("stage") || "New")
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const deals = (db.deals || []).map((d: any) => (d.id === id ? { ...d, stage } : d))
  await writeFile(crmPath, JSON.stringify({ ...db, deals }, null, 2))
  revalidatePath("/admin/crm")
  return { ok: true }
}

export default async function AdminCRMPage() {
  const raw = await readFile(crmPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const leads = (db.leads || []) as any[]
  const deals = (db.deals || []) as any[]
  const contacts = (db.contacts || []) as any[]
  const stages = ["New", "Qualified", "Proposal", "Won", "Lost"]
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="relative isolate overflow-hidden rounded-b-2xl bg-gradient-to-r from-primary to-primary/80 text-white animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CRM</h1>
                <p className="text-sm md:text-base/relaxed opacity-90">Manage leads, contacts, deals and pipelines</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <a className="px-3 py-2 rounded-md border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40" href="/data/crm.json" download aria-label="Export CRM data">Export</a>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/10 backdrop-blur border border-white/20 p-4 transition-transform hover:scale-[1.02]">
                <div className="text-xs opacity-80">Leads</div>
                <div className="text-2xl font-semibold">{leads.length}</div>
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur border border-white/20 p-4 transition-transform hover:scale-[1.02]">
                <div className="text-xs opacity-80">Deals</div>
                <div className="text-2xl font-semibold">{deals.length}</div>
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur border border-white/20 p-4 transition-transform hover:scale-[1.02]">
                <div className="text-xs opacity-80">Contacts</div>
                <div className="text-2xl font-semibold">{contacts.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-16 z-10 bg-white/80 backdrop-blur border-b border-gray-100 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">Leads {leads.length}</span>
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">Deals {deals.length}</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Contacts {contacts.length}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="sr-only" htmlFor="crm-search">Search</label>
              <input id="crm-search" placeholder="Search" className="p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Search CRM" />
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Filter">Filter</button>
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Sort">Sort</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Leads</h2>
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Source</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2 font-medium">{l.name}</td>
                        <td className="p-2">{l.email}</td>
                        <td className="p-2">{l.phone}</td>
                        <td className="p-2">{l.company}</td>
                        <td className="p-2">{l.source}</td>
                        <td className="p-2"><span className="px-2 py-1 rounded bg-gray-100">{l.status}</span></td>
                        <td className="p-2">
                          <SaveForm action={updateLeadStatus} className="flex items-center gap-2">
                            <input type="hidden" name="id" defaultValue={l.id} />
                            <select name="status" defaultValue={l.status} className="text-xs border rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Update lead status">
                              <option>New</option>
                              <option>Contacted</option>
                              <option>Qualified</option>
                              <option>Unqualified</option>
                            </select>
                            <SubmitButton className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Update</SubmitButton>
                          </SaveForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Deals Pipeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {stages.map((s) => (
                  <div key={s} className="border rounded p-2 hover:bg-gray-50 transition-colors">
                    <div className="text-xs font-semibold mb-2">{s}</div>
                    <div className="space-y-2">
                      {deals.filter((d) => d.stage === s).map((d) => (
                        <div key={d.id} className="border rounded p-2">
                          <div className="font-medium text-sm">{d.title}</div>
                          <div className="text-xs text-gray-500">₱{Number(d.value||0).toLocaleString()}</div>
                          <SaveForm action={updateDealStage} className="flex items-center gap-2 mt-2">
                            <input type="hidden" name="id" defaultValue={d.id} />
                            <select name="stage" defaultValue={d.stage} className="text-xs border rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Move deal stage">
                              {stages.map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                            <SubmitButton className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Move</SubmitButton>
                          </SaveForm>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h2>
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2 font-medium">{c.name}</td>
                        <td className="p-2">{c.email}</td>
                        <td className="p-2">{c.phone}</td>
                        <td className="p-2">{c.company}</td>
                        <td className="p-2">{(c.tags||[]).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Add Lead</h2>
              <SaveForm action={addLead} className="grid grid-cols-1 gap-3">
                <SelectOnFocusInput name="name" placeholder="Name" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SelectOnFocusInput name="email" placeholder="Email" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SelectOnFocusInput name="phone" placeholder="Phone" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SelectOnFocusInput name="company" placeholder="Company" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SelectOnFocusInput name="source" placeholder="Source" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SelectOnFocusTextarea name="notes" placeholder="Notes" className="p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <SubmitButton className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Add Lead</SubmitButton>
              </SaveForm>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Add Deal</h2>
              <SaveForm action={addDeal} className="grid grid-cols-1 gap-3">
                <SelectOnFocusInput name="title" placeholder="Deal Title" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="value" placeholder="Value (₱)" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="contact_id" placeholder="Lead ID" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="due_date" placeholder="Due Date" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="next_activity" placeholder="Next Activity" className="p-2 border border-gray-200 rounded" />
                <SubmitButton className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Add Deal</SubmitButton>
              </SaveForm>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Add Contact</h2>
              <SaveForm action={addContact} className="grid grid-cols-1 gap-3">
                <SelectOnFocusInput name="c_name" placeholder="Name" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="c_email" placeholder="Email" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="c_phone" placeholder="Phone" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="c_company" placeholder="Company" className="p-2 border border-gray-200 rounded" />
                <SelectOnFocusInput name="c_tags" placeholder="Tags (comma-separated)" className="p-2 border border-gray-200 rounded" />
                <SubmitButton className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Add Contact</SubmitButton>
              </SaveForm>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
