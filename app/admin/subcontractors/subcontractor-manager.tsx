"use client"
import * as React from "react"
import Link from "next/link"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { useSearchParams, useRouter } from "next/navigation"

export function SubcontractorManager({
    initialList,
    initialRfqs,
    lastById,
    saveAction,
    addAction,
    deleteAction,
    sendAction,
    resendAction,
    updateTemplateAction
}: any) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const editId = searchParams.get("editId")
    const showAdd = searchParams.get("showAdd") === "true"
    const showRFQ = searchParams.get("showRFQ") === "true"

    const list = initialList
    const rfqs = initialRfqs
    const editItem = editId ? list.find((f: any) => f.id === editId) : null

    const nextId = React.useMemo(() => {
        if (!list || list.length === 0) return "fab-001"

        let maxNum = -1
        let prefix = "fab-"
        let padLength = 3

        list.forEach((f: any) => {
            const match = String(f.id).match(/^([a-zA-Z\-_]+?)(\d+)$/)
            if (match) {
                const p = match[1]
                const nStr = match[2]
                const n = parseInt(nStr, 10)
                if (n > maxNum) {
                    maxNum = n
                    prefix = p
                    padLength = nStr.length
                }
            }
        })

        if (maxNum === -1) return "fab-001"

        const nextNum = maxNum + 1
        return `${prefix}${String(nextNum).padStart(padLength, '0')}`
    }, [list])

    const closeModal = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("editId")
        params.delete("showAdd")
        params.delete("showRFQ")
        router.replace(`/admin/subcontractors?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="max-w-6xl mx-auto px-4 space-y-8">
            <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subcontractors</h1>
                            <p className="text-sm md:text-base/relaxed opacity-90">Manage third-party subcontractor cost profiles and rates</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/subcontractors?showRFQ=true" scroll={false} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                Send RFQ
                            </Link>
                            <Link href="/admin/subcontractors?showAdd=true" scroll={false} className="px-4 py-2 rounded-lg bg-white text-primary text-sm font-bold hover:bg-white/90 transition-all shadow-lg flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Add Subcontractor
                            </Link>
                            <span className="hidden md:inline-flex px-3 py-1 rounded-md bg-black/10 border border-white/10 text-xs font-medium ml-2">Total: {list.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-3">Subcontractors</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {list.map((f: any) => (
                                <div key={f.id} className="rounded-xl border border-border/40 p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium text-foreground">{f.name}</div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${f.category
                                                ? "bg-primary/10 text-primary border-primary/20"
                                                : "bg-muted text-muted-foreground border-border/50"
                                                }`}>
                                                {f.category || "Uncategorized"}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                        <div>Board cut: ₱{f?.rates?.board_cut || 0} <span className="text-[10px] opacity-60">({f?.units?.board_cut || 'per job'})</span></div>
                                        <div>Edge band: ₱{f?.rates?.edge_band || 0} <span className="text-[10px] opacity-60">({f?.units?.edge_band || 'per job'})</span></div>
                                        <div>Assembly: ₱{f?.rates?.assembly || 0} <span className="text-[10px] opacity-60">({f?.units?.assembly || 'per job'})</span></div>
                                        <div>Design: ₱{f?.rates?.design || 0} <span className="text-[10px] opacity-60">({f?.units?.design || 'per job'})</span></div>
                                        <div>Install: ₱{f?.rates?.install || 0} <span className="text-[10px] opacity-60">({f?.units?.install || 'per job'})</span></div>
                                        <div>Countertop: ₱{f?.rates?.countertop || 0} <span className="text-[10px] opacity-60">({f?.units?.countertop || 'per job'})</span></div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-4">
                                        <div>Email: {f?.email || "—"}</div>
                                        <div>Phone: {f?.phone || "—"}</div>
                                    </div>
                                    {f.notes && <div className="mt-1 italic opacity-80">Note: {f.notes}</div>}
                                    {lastById[f.id] && (
                                        <div>Last RFQ: {new Date(lastById[f.id].ts).toLocaleString()} • {lastById[f.id].ok ? "Sent" : "Failed"}</div>
                                    )}
                                    {lastById[f.id]?.files && Array.isArray(lastById[f.id].files) && lastById[f.id].files.length > 0 && (
                                        <div className="mt-1">Files: {lastById[f.id].files.map((p: string, i: number) => (
                                            <a key={p} href={p} className="underline mr-2" target="_blank" rel="noreferrer">File {i + 1}</a>
                                        ))}</div>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <Link className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" href={`/admin/subcontractors?editId=${f.id}`} scroll={false} aria-label={`Edit ${f.name}`}>
                                            Edit
                                        </Link>
                                        <SaveForm action={deleteAction} onSubmitted={closeModal}>
                                            <input type="hidden" name="id" value={f.id} />
                                            <SubmitButton
                                                confirm={`Are you sure you want to delete ${f.name}?`}
                                                type="danger"
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" aria-label={`Delete ${f.name}`}
                                            >
                                                Delete
                                            </SubmitButton>
                                        </SaveForm>
                                        <details className="text-sm">
                                            <summary className="cursor-pointer px-3 py-2 rounded-md border">Quick RFQ</summary>
                                            <div className="mt-2 p-2 border rounded-md">
                                                <SaveForm action={sendAction} className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                                                        <SubmitButton confirm={`Send RFQ to ${f.name}?`} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">Send RFQ</SubmitButton>
                                                    </div>
                                                </SaveForm>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            ))}
                            {list.length === 0 && (
                                <div className="text-sm text-muted-foreground">No subcontractors yet</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-3">Guidelines</h2>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li>Use unique IDs to prevent conflicts.</li>
                            <li>All rates should be per job or per meter basis.</li>
                            <li>Update history is stored automatically for audit.</li>
                        </ul>
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-foreground mb-2">RFQ Message Template</h3>
                            <SaveForm action={updateTemplateAction} className="space-y-2">
                                <textarea name="rfq_template_text" placeholder="Default RFQ email body…" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                <SubmitButton confirm="Save template?" className="px-3 py-2 rounded-md border text-sm">Save Template</SubmitButton>
                            </SaveForm>
                        </div>
                    </div>

                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-3">Recent RFQs</h2>
                        <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="text-left p-2">Subcontractor</th>
                                        <th className="text-left p-2">Email</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-left p-2">Files</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rfqs.slice(0, 20).map((e: any) => (
                                        <tr key={`${e.gmail_id || e.ts}-${e.to_email || e.to}`} className="border-t">
                                            <td className="p-2">{e.name || (list.find((f: any) => String(f.id) === String(e.fabricator_id))?.name) || e.fabricator_id || "—"}</td>
                                            <td className="p-2 truncate max-w-[100px]">{e.to_email || e.to || "—"}</td>
                                            <td className="p-2">{e.ok ? "Sent" : "Failed"}</td>
                                            <td className="p-2 text-[10px]">{new Date(Number(e.ts) || Date.now()).toLocaleDateString()}</td>
                                            <td className="p-2">
                                                <div className="flex flex-col gap-1">
                                                    {Array.isArray(e.files) && e.files.length > 0 ? e.files.map((p: string, i: number) => (
                                                        <a key={`${p}-${i}`} href={p} className="underline text-[10px]" target="_blank" rel="noreferrer">File {i + 1}</a>
                                                    )) : "—"}
                                                    <SaveForm action={resendAction}>
                                                        {e.id ? <input type="hidden" name="event_id" value={e.id} /> : null}
                                                        {!e.id ? <input type="hidden" name="ts" value={String(e.ts || "")} /> : null}
                                                        <SubmitButton confirm="Are you sure you want to resend this RFQ?" className="px-2 py-0.5 rounded border text-[10px]">Resend</SubmitButton>
                                                    </SaveForm>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rfqs.length === 0 && (
                                        <tr><td className="p-3 text-muted-foreground" colSpan={5}>No RFQs yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {
                editItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Edit Subcontractor</h2>
                                    <p className="text-sm text-muted-foreground italic">Updating {editItem.name} ({editItem.id})</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <SaveForm action={saveAction} onSubmitted={closeModal} className="space-y-6">
                                <input type="hidden" name="id" defaultValue={editItem.id} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Name</label>
                                        <input name="name" defaultValue={editItem.name} className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                        <input name="email" type="email" defaultValue={editItem.email || ""} className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Contact Number</label>
                                        <input name="phone" defaultValue={editItem.phone || ""} className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                                        <select name="category" defaultValue={editItem.category || ""} className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                            <option value="">Select Category</option>
                                            <option value="CNC Cutting Services">CNC Cutting Services</option>
                                            <option value="CNC Programmer">CNC Programmer</option>
                                            <option value="Cabinet Installer">Cabinet Installer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-border/40">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3 block">Rate Configuration (per unit/m)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                                        {[
                                            { id: 'board_cut', label: 'Board Cut' },
                                            { id: 'edge_band', label: 'Edge Band' },
                                            { id: 'assembly', label: 'Assembly' },
                                            { id: 'design', label: 'Design' },
                                            { id: 'install', label: 'Install' },
                                            { id: 'countertop', label: 'Countertop' }
                                        ].map(r => (
                                            <div key={r.id} className="flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1">{r.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₱</span>
                                                        <input name={r.id} type="number" step="0.01" defaultValue={editItem.rates?.[r.id] || 0} className="w-full p-2 pl-6 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="w-32 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1 text-transparent">.</label>
                                                    <select name={`unit_${r.id}`} defaultValue={editItem.units?.[r.id] || "per job"} className="w-full p-2 border border-border/40 rounded bg-background text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 h-[38px]">
                                                        <option value="per job">per job</option>
                                                        <option value="per sqm">per sqm</option>
                                                        <option value="per linear meter">per linear m</option>
                                                        <option value="per feet">per feet</option>
                                                        <option value="per project">per project</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Notes</label>
                                    <textarea name="notes" defaultValue={editItem.notes || ""} className="w-full p-3 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] text-sm" placeholder="Additional details or special instructions..." />
                                </div>

                                <div className="flex gap-3 pt-4 justify-end">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium">Cancel</button>
                                    <SubmitButton confirm={`Save changes to ${editItem.name}?`} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/20 text-sm font-bold">
                                        Save Changes
                                    </SubmitButton>
                                </div>
                            </SaveForm>
                        </div>
                    </div>
                )
            }

            {
                showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-3xl bg-card border border-border/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Add New Subcontractor</h2>
                                    <p className="text-sm text-muted-foreground">Register a new third-party service provider</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <SaveForm action={addAction} onSubmitted={closeModal} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">ID</label>
                                        <input name="id" defaultValue={nextId} placeholder="fab_123" required className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                                    </div>
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Company Name</label>
                                        <input name="name" placeholder="Acme Subcontractor" required className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                                        <select name="category" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                            <option value="">Select Category</option>
                                            <option value="CNC Cutting Services">CNC Cutting Services</option>
                                            <option value="CNC Programmer">CNC Programmer</option>
                                            <option value="Cabinet Installer">Cabinet Installer</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                                        <input name="email" type="email" placeholder="subcontractor@example.com" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Contact Number</label>
                                        <input name="phone" placeholder="+63 9xx xxx xxxx" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/40">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block">Default Rates</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                                        {['board_cut', 'edge_band', 'assembly', 'design', 'install', 'countertop'].map(r => (
                                            <div key={r} className="flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1 capitalize">{r.replace('_', ' ')}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₱</span>
                                                        <input name={r} type="number" step="0.01" placeholder="0" className="w-full p-2 pl-6 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="w-32 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1 text-transparent">.</label>
                                                    <select name={`unit_${r}`} className="w-full p-2 border border-border/40 rounded bg-background text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 h-[38px]">
                                                        <option value="per job">per job</option>
                                                        <option value="per sqm">per sqm</option>
                                                        <option value="per linear meter">per linear m</option>
                                                        <option value="per feet">per feet</option>
                                                        <option value="per project">per project</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Notes</label>
                                    <textarea name="notes" placeholder="Additional details or special instructions..." className="w-full p-3 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] text-sm" />
                                </div>

                                <div className="flex gap-3 pt-4 justify-end">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium">Cancel</button>
                                    <SubmitButton className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/20 text-sm font-bold">
                                        Add Subcontractor
                                    </SubmitButton>
                                </div>
                            </SaveForm>
                        </div>
                    </div>
                )
            }

            {
                showRFQ && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-3xl bg-card border border-border/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Send RFQ</h2>
                                    <p className="text-sm text-muted-foreground italic">Request for quotation with plans and profile</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            <SaveForm action={sendAction} onSubmitted={closeModal} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Select Subcontractor</label>
                                        <select name="fabricator_id" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                            <option value="">Choose from list...</option>
                                            {list.map((f: any) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Or direct email</label>
                                        <input name="email" type="email" placeholder="subcontractor@example.com" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Custom Name (optional)</label>
                                        <input name="name" placeholder="Leave blank to use selected subcontractor name" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Cabinet Plan (PDF)</label>
                                        <input name="plan_pdf" type="file" accept="application/pdf" className="w-full p-2 border border-border/40 rounded-lg bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Subcontractor Profile (PDF)</label>
                                        <input name="profile_pdf" type="file" accept="application/pdf" className="w-full p-2 border border-border/40 rounded-lg bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Message Body</label>
                                    <textarea name="message" placeholder="Write a short request for quotation…" className="w-full p-3 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] text-sm" />
                                </div>

                                <div className="flex gap-3 pt-4 justify-end">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium">Cancel</button>
                                    <SubmitButton confirm="Send this RFQ?" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/20 text-sm font-bold flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                        Send RFQ
                                    </SubmitButton>
                                </div>
                            </SaveForm>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
