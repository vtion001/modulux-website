import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { ToastOnParam } from "@/components/admin/toast-on-param"
import { redirect } from "next/navigation"
import Link from "next/link"
import { supabaseServer } from "@/lib/supabase-server"


async function addLead(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const company = String(formData.get("company") || "").trim()
  const source = String(formData.get("source") || "Inbound").trim()
  const notes = String(formData.get("notes") || "").trim()
  if (!name && !email) return { ok: false, error: "Name or email required" }
  const supabase = supabaseServer()
  await supabase.from("leads").insert({ name, email, phone, company, source, status: "New", notes })
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=lead-added")
}

async function addDeal(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const title = String(formData.get("title") || "").trim()
  const contactId = String(formData.get("contact_id") || "").trim()
  const value = Number(formData.get("value") || 0)
  const nextActivity = String(formData.get("next_activity") || "").trim()
  const dueDate = String(formData.get("due_date") || "").trim()
  if (!title || !contactId) return { ok: false, error: "Title and contact ID required" }
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 0
  const supabase = supabaseServer()
  await supabase.from("deals").insert({ title, contact_id: contactId || null, value: safeValue, stage: "New", next_activity: nextActivity || null, due_date: dueDate || null })
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=deal-added")
}

async function addContact(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const name = String(formData.get("c_name") || "").trim()
  const email = String(formData.get("c_email") || "").trim()
  const phone = String(formData.get("c_phone") || "").trim()
  const company = String(formData.get("c_company") || "").trim()
  const tagsStr = String(formData.get("c_tags") || "").trim()
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : []
  if (!name && !email) return { ok: false, error: "Name or email required" }
  const supabase = supabaseServer()
  await supabase.from("contacts").insert({ name, email, phone, company, tags })
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=contact-added")
}

async function updateLeadStatus(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const id = String(formData.get("id") || "")
  const status = String(formData.get("status") || "New")
  const supabase = supabaseServer()
  await supabase.from("leads").update({ status }).eq("id", id)
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=lead-updated")
}

async function updateDealStage(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const id = String(formData.get("id") || "")
  const stage = String(formData.get("stage") || "New")
  const supabase = supabaseServer()
  await supabase.from("deals").update({ stage }).eq("id", id)
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=deal-updated")
}

async function updateContact(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const company = String(formData.get("company") || "").trim()
  const tagsStr = String(formData.get("tags") || "").trim()
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : []
  if (!id) return { ok: false }
  const supabase = supabaseServer()
  await supabase.from("contacts").update({ name, email, phone, company, tags }).eq("id", id)
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=contact-updated")
}

async function deleteContact(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  if (!id) return { ok: false }
  const supabase = supabaseServer()
  await supabase.from("contacts").delete().eq("id", id)
  revalidatePath("/admin/crm")
  redirect("/admin/crm?ok=contact-deleted")
}

export default async function AdminCRMPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const supabase = supabaseServer()
  const { data: leadsRaw } = await supabase.from("leads").select("*").order("created_at", { ascending: false })
  const { data: dealsRaw } = await supabase.from("deals").select("*").order("created_at", { ascending: false })
  const { data: contactsRaw } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })
  const leads = leadsRaw || []
  const leadFocusId = String(searchParams?.lead || "").trim()
  const leadsView = leadFocusId ? [leads.find((l: any) => String(l.id) === leadFocusId), ...leads.filter((l: any) => String(l.id) !== leadFocusId)].filter(Boolean) : leads
  const deals = dealsRaw || []
  const contacts = contactsRaw || []
  const focusId = String(searchParams?.contact || "").trim()
  const focused = focusId ? contacts.find((c: any) => String(c.id) === focusId) : null
  const contactsView = focused ? [focused, ...contacts.filter((c: any) => String(c.id) !== focusId)] : contacts
  const dealFocusId = String(searchParams?.deal || "").trim()
  const stages = ["New", "Qualified", "Proposal", "Won", "Lost"]
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <ToastOnParam param="ok" value="lead-added" message="Lead added" />
      <ToastOnParam param="ok" value="deal-added" message="Deal added" />
      <ToastOnParam param="ok" value="contact-added" message="Contact added" />
      <ToastOnParam param="ok" value="lead-updated" message="Lead updated" />
      <ToastOnParam param="ok" value="deal-updated" message="Deal updated" />
      <ToastOnParam param="ok" value="contact-updated" message="Contact updated" />
      <ToastOnParam param="ok" value="contact-deleted" message="Contact deleted" />

      {/* Registry Auto-Close Handler */}
      <script dangerouslySetInnerHTML={{
        __html: `
        window.addEventListener('modal:close', () => {
          document.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
        });
      ` }} />
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              <span className="text-slate-900">CRM Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Client Relations <span className="text-primary/30">/</span> Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                +12
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 rounded-2xl bg-white border border-slate-100 text-[12px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                Activity Logs
              </button>
              <button className="px-6 py-3 rounded-2xl bg-[#1e3a2e] text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#1e3a2e]/90 transition-all shadow-[0_8px_30px_rgb(30,58,46,0.2)]">
                Sync Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-8 space-y-10 pb-32">
        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Leads", value: leads.length, color: "bg-primary", secondary: "bg-primary/10", text: "text-primary" },
            { label: "Active Deals", value: deals.length, color: "bg-secondary", secondary: "bg-secondary/10", text: "text-secondary" },
            { label: "Database Contacts", value: contacts.length, color: "bg-slate-900", secondary: "bg-slate-100", text: "text-slate-900" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${stat.secondary} flex items-center justify-center`}>
                <div className={`w-3 h-3 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mb-0.5"></span>
                    Recent Leads & Inquiries
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Pipeline Feed</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <input placeholder="Filter leads..." className="pl-11 pr-4 py-3 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[12px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all w-64" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prospect Details</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company / Source</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leadsView.map((l) => (
                      <tr key={l.id} className="group hover:bg-[#FAFBFB] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-400 font-black text-sm uppercase shadow-sm">
                              {l.name ? l.name.charAt(0) : "L"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-black text-slate-900 group-hover:text-primary transition-colors">{l.name}</p>
                              <p className="text-[11px] font-bold text-slate-400 truncate">{l.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-[13px] font-black text-slate-700">{l.company || "Direct Individual"}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.source}</p>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${l.status === 'New' ? 'bg-primary/10 text-primary border-primary/20' :
                            l.status === 'Qualified' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <SaveForm action={updateLeadStatus} className="inline-flex items-center gap-3">
                            <input type="hidden" name="id" defaultValue={l.id} />
                            <select name="status" defaultValue={l.status} className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black uppercase focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all">
                              <option>New</option>
                              <option>Contacted</option>
                              <option>Qualified</option>
                              <option>Unqualified</option>
                            </select>
                            <SubmitButton confirm="Update engagement status?" className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-primary transition-all shadow-lg shadow-slate-200">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </SubmitButton>
                          </SaveForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-10">
              <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-secondary mb-0.5"></span>
                  Portfolio Opportunities (Deals)
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Capital Management Pipeline</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {stages.map((s) => (
                  <div key={s} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s}</span>
                      <span className="w-5 h-5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black flex items-center justify-center border border-slate-100">{deals.filter(d => d.stage === s).length}</span>
                    </div>
                    <div className="space-y-4">
                      {deals.filter((d) => d.stage === s).map((d) => (
                        <div key={d.id} className="bg-[#FAFBFB] p-5 rounded-[28px] border border-slate-100 hover:border-secondary/30 hover:shadow-xl hover:shadow-secondary/5 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                          <p className="text-[13px] font-black text-slate-900 mb-1 relative z-10 truncate">{d.title}</p>
                          <p className="text-[15px] font-black text-secondary tracking-tighter mb-4 relative z-10">₱{Number(d.value || 0).toLocaleString()}</p>

                          <SaveForm action={updateDealStage} className="space-y-3 relative z-10">
                            <input type="hidden" name="id" defaultValue={d.id} />
                            <select name="stage" defaultValue={d.stage} className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase focus:outline-none">
                              {stages.map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                            <SubmitButton className="w-full py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all">Advance</SubmitButton>
                          </SaveForm>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] mt-8">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-slate-900 mb-0.5"></span>
                    Contacts Database
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Relationship Registry</p>
                </div>
              </div>

              <div className="relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity / Contact</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Association</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Registry Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {contactsView.map((c) => (
                      <tr key={c.id} className="group hover:bg-[#FAFBFB] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-400 font-black text-sm uppercase shadow-sm">
                              {c.name ? c.name.charAt(0) : "C"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-black text-slate-900 group-hover:text-primary transition-colors">{c.name}</p>
                              <p className="text-[11px] font-bold text-slate-400 truncate">{c.email} {c.phone && `• ${c.phone}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-black text-slate-700 text-[13px]">
                          {c.company || "Independent"}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-wrap gap-1.5">
                            {(c.tags || []).map((tag: any, i: number) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {tag}
                              </span>
                            ))}
                            {(!c.tags || c.tags.length === 0) && <span className="text-[10px] font-bold text-slate-300 italic">No Tags</span>}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right relative">
                          <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity relative">
                            <details className="relative text-left">
                              <summary className="list-none cursor-pointer p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" /></svg>
                              </summary>
                              <div className="absolute right-0 bottom-full mb-4 z-[100] w-[420px] bg-white text-foreground rounded-[32px] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.15)] p-10 text-left animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-slate-100/50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Update Identity
                                </p>
                                <SaveForm action={updateContact} className="space-y-4">
                                  <input type="hidden" name="id" defaultValue={c.id} />
                                  <div className="grid grid-cols-2 gap-4">
                                    <input name="name" defaultValue={c.name || ""} placeholder="Full Name" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                                    <input name="email" defaultValue={c.email || ""} placeholder="Email" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                                    <input name="phone" defaultValue={c.phone || ""} placeholder="Phone" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                                    <input name="company" defaultValue={c.company || ""} placeholder="Organization" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                                  </div>
                                  <input name="tags" defaultValue={(c.tags || []).join(", ")} placeholder="Tags (comma-separated)" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                                  <SubmitButton className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-primary/10">Save Registry Updates</SubmitButton>
                                </SaveForm>
                              </div>
                            </details>

                            <details className="relative text-left">
                              <summary className="list-none cursor-pointer p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all group/del">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover/del:text-red-500"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </summary>
                              <div className="absolute right-0 bottom-full mb-4 z-[100] w-72 bg-white text-foreground rounded-[28px] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.15)] p-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-slate-100/50">
                                <p className="text-[12px] font-black text-slate-900 mb-2">Discard Contact?</p>
                                <p className="text-[11px] font-medium text-slate-400 mb-4">This operation is irreversible and will remove all associated history.</p>
                                <SaveForm action={deleteContact} className="flex gap-2">
                                  <input type="hidden" name="id" defaultValue={c.id} />
                                  <SubmitButton className="flex-1 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg">Confirm</SubmitButton>
                                </SaveForm>
                              </div>
                            </details>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Add / Sidebar Column */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-900">Prospect Intake</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rapid Onboarding</p>
                </div>
              </div>

              <SaveForm action={addLead} className="space-y-4">
                <input name="name" placeholder="Contact Name" required className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <input name="email" type="email" placeholder="Email Address" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <input name="phone" placeholder="Phone Link" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <input name="company" placeholder="Organization" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <input name="source" placeholder="Acquisition Source" className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                <textarea name="notes" placeholder="Initial Briefing..." className="w-full px-5 py-4 bg-[#FAFBFB] border border-slate-100 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all min-h-[100px] resize-none" />
                <SubmitButton className="w-full py-5 bg-[#1e3a2e] text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Submit Intake</SubmitButton>
              </SaveForm>
            </div>

            <div className="bg-[#1e3a2e] p-8 rounded-[40px] shadow-[0_32px_80px_rgba(30,58,46,0.3)] text-white overflow-hidden relative">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full -mb-20 -mr-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  </div>
                  <h3 className="text-[14px] font-black tracking-tight">System Insights</h3>
                </div>
                <p className="text-[13px] leading-relaxed opacity-80 font-medium mb-6">
                  Your conversion rate has increased by <span className="text-secondary font-black">12.4%</span> since the last audit. Capitalize on the pending deals in the 'Proposal' stage for Q1 yield.
                </p>
                <button className="w-full py-4 bg-white text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Performance Audit</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

}
