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
    const [showFullList, setShowFullList] = React.useState(false)

    const list = initialList
    const rfqs = initialRfqs
    const editItem = editId ? list.find((f: any) => f.id === editId) : null

    const [rfqSubId, setRfqSubId] = React.useState(searchParams.get("rfqSubId") || searchParams.get("rfqFabId") || "")
    const [rfqEmail, setRfqEmail] = React.useState("")
    const [rfqName, setRfqName] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [categoryFilter, setCategoryFilter] = React.useState("")

    // Update rfqFabId when search params change (e.g. from a Link)
    React.useEffect(() => {
        const id = searchParams.get("rfqSubId") || searchParams.get("rfqFabId")
        if (id) setRfqSubId(id)
    }, [searchParams])

    React.useEffect(() => {
        if (rfqSubId) {
            const fab = list.find((f: any) => f.id === rfqSubId)
            if (fab) {
                setRfqEmail(fab.email || "")
                setRfqName(fab.name || "")
            }
        }
    }, [rfqSubId, list])

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

    const analytics = React.useMemo(() => {
        const counts = {
            installers: 0,
            fabricators: 0,
            programmers: 0
        }
        list.forEach((f: any) => {
            if (f.category === "Cabinet Installer") counts.installers++
            else if (f.category === "CNC Cutting Services") counts.fabricators++
            else if (f.category === "CNC Programmer") counts.programmers++
        })
        return counts
    }, [list])

    const closeModal = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("editId")
        params.delete("showAdd")
        params.delete("showRFQ")
        params.delete("rfqSubId")
        params.delete("rfqFabId")
        router.replace(`/admin/subcontractors?${params.toString()}`, { scroll: false })
    }

    const filteredList = list.filter((f: any) => {
        const matchesSearch = !searchQuery ||
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.email && f.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = !categoryFilter || f.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const renderSubcontractorItem = (f: any) => (
        <div key={f.id} className="rounded-xl border border-border/40 p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] bg-card/50">
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
                <div className="text-xs text-muted-foreground font-mono">ID: {f.id}</div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 text-sm">
                <div className="flex items-center gap-1.5"><span className="opacity-60">Board:</span> ₱{f?.rates?.board_cut || 0} <span className="text-[10px] opacity-40">({f?.units?.board_cut || 'job'})</span></div>
                <div className="flex items-center gap-1.5"><span className="opacity-60">Edge:</span> ₱{f?.rates?.edge_band || 0} <span className="text-[10px] opacity-40">({f?.units?.edge_band || 'job'})</span></div>
                <div className="flex items-center gap-1.5"><span className="opacity-60">Asm:</span> ₱{f?.rates?.assembly || 0} <span className="text-[10px] opacity-40">({f?.units?.assembly || 'job'})</span></div>
                <div className="flex items-center gap-1.5"><span className="opacity-60">Design:</span> ₱{f?.rates?.design || 0} <span className="text-[10px] opacity-40">({f?.units?.design || 'job'})</span></div>
                <div className="flex items-center gap-1.5"><span className="opacity-60">Inst:</span> ₱{f?.rates?.install || 0} <span className="text-[10px] opacity-40">({f?.units?.install || 'job'})</span></div>
                <div className="flex items-center gap-1.5"><span className="opacity-60">Counter:</span> ₱{f?.rates?.countertop || 0} <span className="text-[10px] opacity-40">({f?.units?.countertop || 'job'})</span></div>
            </div>
            {(f?.rates?.drawer > 0 || f?.rates?.base_cabinet > 0 || f?.rates?.wall_cabinet > 0 || f?.rates?.closet > 0) && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] bg-muted/30 p-2 rounded-lg border border-border/10">
                    {f?.rates?.drawer > 0 && <div className="flex items-center gap-1"><span className="opacity-60">Drawer:</span> ₱{f.rates.drawer}</div>}
                    {f?.rates?.base_cabinet > 0 && <div className="flex items-center gap-1"><span className="opacity-60">Base:</span> ₱{f.rates.base_cabinet}</div>}
                    {f?.rates?.wall_cabinet > 0 && <div className="flex items-center gap-1"><span className="opacity-60">Wall:</span> ₱{f.rates.wall_cabinet}</div>}
                    {f?.rates?.closet > 0 && <div className="flex items-center gap-1"><span className="opacity-60">Closet:</span> ₱{f.rates.closet}</div>}
                </div>
            )}
            <div className="mt-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 border-t border-border/20 pt-2">
                <div>Email: {f?.email || "—"}</div>
                <div>Phone: {f?.phone || "—"}</div>
                {f.notes && <div className="italic opacity-70 truncate max-w-[200px]">Note: {f.notes}</div>}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
                <div className="flex gap-2">
                    <Link
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/50 text-xs transition-all duration-200 hover:bg-muted"
                        href={`/admin/subcontractors?editId=${f.id}`}
                        scroll={false}
                        onClick={() => setShowFullList(false)}
                    >
                        Edit
                    </Link>
                    <SaveForm action={deleteAction} onSubmitted={closeModal}>
                        <input type="hidden" name="id" value={f.id} />
                        <SubmitButton
                            confirm={`Delete ${f.name}?`}
                            type="danger"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/50 text-xs transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                        >
                            Delete
                        </SubmitButton>
                    </SaveForm>
                </div>

                <Link
                    href={`/admin/subcontractors?showRFQ=true&rfqSubId=${f.id}`}
                    scroll={false}
                    onClick={() => setShowFullList(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    Quick RFQ
                </Link>
            </div>
            {lastById[f.id] && (
                <div className="mt-2 text-[10px] text-muted-foreground/60 border-t border-border/10 pt-2 flex justify-between">
                    <span>Last RFQ: {new Date(lastById[f.id].ts).toLocaleString()}</span>
                    <span className={lastById[f.id].ok ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{lastById[f.id].ok ? "SENT" : "FAILED"}</span>
                </div>
            )}
        </div>
    )

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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-foreground">Subcontractors List</h2>
                            <button
                                onClick={() => setShowFullList(true)}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                Full View Modal
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            {list.slice(0, 3).map(renderSubcontractorItem)}

                            {list.length > 3 && (
                                <div className="pt-4 mt-2 border-t border-dashed border-border/40 flex justify-center">
                                    <button
                                        onClick={() => setShowFullList(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-all group shadow-sm hover:shadow"
                                    >
                                        View All {list.length} Subcontractors
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </button>
                                </div>
                            )}

                            {list.length === 0 && (
                                <div className="text-sm text-muted-foreground py-12 text-center italic border border-dashed rounded-xl">No subcontractors registered yet.</div>
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
                            <h3 className="text-sm font-semibold text-foreground mb-2 font-bold">RFQ Message Template</h3>
                            <SaveForm action={updateTemplateAction} className="space-y-2">
                                <textarea name="rfq_template_text" placeholder="Default RFQ email body…" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[100px]" />
                                <SubmitButton confirm="Save template?" className="w-full py-2 bg-muted text-foreground rounded-md border text-xs font-bold hover:bg-muted/80 transition-colors">Save Template</SubmitButton>
                            </SaveForm>
                        </div>
                    </div>

                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-3">Recent RFQs</h2>
                        <div className="overflow-x-auto rounded-md border border-border/20">
                            <table className="min-w-full text-[10px]">
                                <thead className="bg-muted/30">
                                    <tr className="border-b border-border/20">
                                        <th className="text-left p-2">Subcon</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-left p-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rfqs.slice(0, 10).map((e: any) => (
                                        <tr key={`${e.gmail_id || e.ts}-${e.to_email || e.to}`} className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors">
                                            <td className="p-2 font-medium truncate max-w-[80px]">{e.name || e.subcontractor_id || e.fabricator_id}</td>
                                            <td className="p-2">
                                                <span className={e.ok ? "text-green-500" : "text-red-500"}>{e.ok ? "OK" : "Err"}</span>
                                            </td>
                                            <td className="p-2 opacity-60 font-mono">{new Date(Number(e.ts) || Date.now()).toLocaleDateString()}</td>
                                            <td className="p-2">
                                                <SaveForm action={resendAction}>
                                                    {e.id ? <input type="hidden" name="event_id" value={e.id} /> : null}
                                                    {!e.id ? <input type="hidden" name="ts" value={String(e.ts || "")} /> : null}
                                                    <SubmitButton confirm="Resend this RFQ?" className="text-[9px] underline text-primary hover:opacity-70">Resend</SubmitButton>
                                                </SaveForm>
                                            </td>
                                        </tr>
                                    ))}
                                    {rfqs.length === 0 && (
                                        <tr><td className="p-4 text-muted-foreground text-center italic" colSpan={4}>No RFQs sent yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                            Subcontractor Analytics
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </div>
                                    <span className="text-xs font-medium">Cabinet Installers</span>
                                </div>
                                <span className="text-sm font-black text-emerald-600">{analytics.installers}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 11-8-8" /><path d="M21 3v8" /><path d="M13 3h8" /><path d="M10.6 19a2 2 0 1 1-2.8-2.8l10.4-10.4" /><path d="m15.8 4.6 2.8 2.8" /><path d="m10.2 15.4 5.2-5.2" /><path d="m4.6 15.8 2.8 2.8" /><path d="M19 10.6a2 2 0 1 1-2.8 2.8l-10.4 10.4" /><path d="m4.6 15.8-2.8-2.8" /><path d="M5.4 10.2l5.2 5.2" /></svg>
                                    </div>
                                    <span className="text-xs font-medium">CNC Fabricators / Service Providers</span>
                                </div>
                                <span className="text-sm font-black text-blue-600">{analytics.fabricators}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="12" y1="22" x2="12" y2="2" /></svg>
                                    </div>
                                    <span className="text-xs font-medium">CNC Programmers</span>
                                </div>
                                <span className="text-sm font-black text-amber-600">{analytics.programmers}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Edit Subcontractor</h2>
                                <p className="text-sm text-muted-foreground italic">Updating {editItem.name} ({editItem.id})</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors">
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
                                <div className="space-y-1.5">
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
                                    {['board_cut', 'edge_band', 'assembly', 'design', 'install', 'countertop'].map(rId => (
                                        <React.Fragment key={rId}>
                                            <div className="flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1 capitalize text-nowrap flex items-center justify-between">
                                                        {rId.replace('_', ' ')}
                                                        {rId === 'install' && (
                                                            <span className="text-[9px] text-primary cursor-pointer hover:underline font-bold bg-primary/5 px-1.5 py-0.5 rounded">Granular ▼</span>
                                                        )}
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₱</span>
                                                        <input name={rId} type="number" step="0.01" defaultValue={editItem.rates?.[rId] || 0} className="w-full p-2 pl-6 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="w-32 space-y-1 pt-[18px]">
                                                    <select name={`unit_${rId}`} defaultValue={editItem.units?.[rId] || (['drawer', 'base_cabinet', 'wall_cabinet', 'closet'].includes(rId) ? "per module" : "per job")} className="w-full p-2 border border-border/40 rounded bg-background text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 h-[38px]">
                                                        <option value="per job">per job</option>
                                                        <option value="per sqm">per sqm</option>
                                                        <option value="per linear meter">per linear m</option>
                                                        <option value="per feet">per feet</option>
                                                        <option value="per project">per project</option>
                                                        <option value="per board">per board</option>
                                                        <option value="per module">per module</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {rId === 'install' && (
                                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border border-dashed border-border/60">
                                                    {['drawer', 'base_cabinet', 'wall_cabinet', 'closet'].map(sub => (
                                                        <div key={sub} className="space-y-1">
                                                            <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70 ml-1">{sub.replace('_', ' ')}</label>
                                                            <div className="flex gap-1.5">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-semibold">₱</span>
                                                                    <input name={sub} type="number" step="0.01" defaultValue={editItem.rates?.[sub] || 0} className="w-full p-1.5 pl-4 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-[11px]" placeholder="0" />
                                                                </div>
                                                                <select name={`unit_${sub}`} defaultValue={editItem.units?.[sub] || "per module"} className="w-16 p-1 border border-border/40 rounded bg-background text-[9px] focus:outline-none h-[28px]">
                                                                    <option value="per module">pc</option>
                                                                    <option value="per linear meter">lm</option>
                                                                    <option value="per feet">ft</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Notes</label>
                                <textarea name="notes" defaultValue={editItem.notes || ""} className="w-full p-3 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] text-sm" />
                            </div>
                            <div className="flex gap-3 pt-4 justify-end">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium">Cancel</button>
                                <SubmitButton confirm={`Save changes?`} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm">Save Changes</SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-3xl bg-card border border-border/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Add New Subcontractor</h2>
                                <p className="text-sm text-muted-foreground">Register a new third-party service provider</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <SaveForm action={addAction} onSubmitted={closeModal} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">ID</label>
                                    <input name="id" defaultValue={nextId} required className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 text-nowrap">Company Name</label>
                                    <input name="name" placeholder="Acme Subcontractor" required className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                    <input name="email" type="email" placeholder="subcon@example.com" className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Phone</label>
                                    <input name="phone" placeholder="+63 9xx..." className="w-full p-2.5 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
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
                            </div>
                            <div className="space-y-3 pt-2 border-t border-border/40">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block">Default Rates</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                                    {['board_cut', 'edge_band', 'assembly', 'design', 'install', 'countertop'].map(r => (
                                        <React.Fragment key={r}>
                                            <div className="flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-medium ml-1 capitalize text-nowrap flex items-center justify-between">
                                                        {r.replace('_', ' ')}
                                                        {r === 'install' && (
                                                            <span className="text-[9px] text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded">Granular ▼</span>
                                                        )}
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₱</span>
                                                        <input name={r} type="number" step="0.01" placeholder="0" className="w-full p-2 pl-6 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                                                    </div>
                                                </div>
                                                <div className="w-32 space-y-1 pt-[18px]">
                                                    <select name={`unit_${r}`} className="w-full p-2 border border-border/40 rounded bg-background text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 h-[38px]">
                                                        <option value="per job">per job</option>
                                                        <option value="per sqm">per sqm</option>
                                                        <option value="per linear meter">per linear m</option>
                                                        <option value="per feet">per feet</option>
                                                        <option value="per project">per project</option>
                                                        <option value="per board">per board</option>
                                                        <option value="per module">per module</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {r === 'install' && (
                                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border border-dashed border-border/60">
                                                    {['drawer', 'base_cabinet', 'wall_cabinet', 'closet'].map(sub => (
                                                        <div key={sub} className="space-y-1">
                                                            <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70 ml-1">{sub.replace('_', ' ')}</label>
                                                            <div className="flex gap-1.5">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-semibold">₱</span>
                                                                    <input name={sub} type="number" step="0.01" className="w-full p-1.5 pl-4 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-[11px]" placeholder="0" />
                                                                </div>
                                                                <select name={`unit_${sub}`} defaultValue="per module" className="w-16 p-1 border border-border/40 rounded bg-background text-[9px] focus:outline-none h-[28px]">
                                                                    <option value="per module">pc</option>
                                                                    <option value="per linear meter">lm</option>
                                                                    <option value="per feet">ft</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Notes</label>
                                <textarea name="notes" placeholder="Notes..." className="w-full p-3 border border-border/40 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[60px] text-sm" />
                            </div>
                            <div className="flex gap-3 pt-4 justify-end">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted text-foreground rounded-lg transition-colors text-sm font-medium">Cancel</button>
                                <SubmitButton className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 text-sm">Add Subcontractor</SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Global RFQ Modal */}
            {showRFQ && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-2xl bg-card border border-border/40 rounded-2xl shadow-2xl p-7 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Send RFQ</h2>
                                    <p className="text-sm text-muted-foreground">Request for quotation with plans and profile</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors bg-background border shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <SaveForm action={sendAction} onSubmitted={closeModal} className="space-y-6" successMessage="RFQ Sent Successfully!">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Subcontractor</label>
                                    <select name="subcontractor_id" value={rfqSubId} onChange={(e) => setRfqSubId(e.target.value)} className="w-full p-3 border border-border/40 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium">
                                        <option value="">Choose from list...</option>
                                        {list.map((f: any) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Or Direct Email</label>
                                    <input name="email" type="email" value={rfqEmail} onChange={(e) => setRfqEmail(e.target.value)} placeholder="subcontractor@example.com" className="w-full p-3 border border-border/40 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Custom Name / Attention To</label>
                                    <input name="name" value={rfqName} onChange={(e) => setRfqName(e.target.value)} placeholder="Name to appear in email..." className="w-full p-3 border border-border/40 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border/20">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Cabinet Plan (PDF/IMAGE)</label>
                                    <div className="relative group">
                                        <input name="plan_pdf" type="file" accept="application/pdf,image/png,image/jpeg" className="w-full p-2.5 border border-border/40 rounded-xl text-xs bg-muted/20 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Subcon Profile (PDF/IMAGE)</label>
                                    <div className="relative group">
                                        <input name="profile_pdf" type="file" accept="application/pdf,image/png,image/jpeg" className="w-full p-2.5 border border-border/40 rounded-xl text-xs bg-muted/20 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Personalized Message</label>
                                <textarea name="message" placeholder="Write a professional request for quotation..." className="w-full p-4 border border-border/40 rounded-xl bg-background text-foreground min-h-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner" />
                            </div>

                            <div className="flex gap-3 pt-6 justify-end items-center">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-muted text-foreground rounded-xl transition-all text-sm font-semibold hover:bg-muted/80">Cancel</button>
                                <SubmitButton confirm="Ready to send this RFQ?" className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/20 text-sm flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                    Send RFQ Now
                                </SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Full View Modal */}
            {showFullList && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl h-[90vh] bg-card border border-border/40 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between bg-muted/20 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Subcontractor Database</h2>
                                <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-60 mt-1">Full Inventory View — {filteredList.length} of {list.length} Records</p>
                            </div>

                            <div className="flex flex-1 max-w-2xl items-center gap-3">
                                <div className="relative flex-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[160px]"
                                >
                                    <option value="">All Categories</option>
                                    <option value="CNC Cutting Services">CNC Cutting Services</option>
                                    <option value="CNC Programmer">CNC Programmer</option>
                                    <option value="Cabinet Installer">Cabinet Installer</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <Link href="/admin/subcontractors?showAdd=true" scroll={false} onClick={() => setShowFullList(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    Add New
                                </Link>
                                <button onClick={() => setShowFullList(false)} className="p-2 rounded-full hover:bg-muted transition-colors bg-background" aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {filteredList.map(renderSubcontractorItem)}
                            </div>
                            {filteredList.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground italic border border-dashed rounded-2xl mx-auto max-w-md">
                                    No subcontractors match your current search criteria.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            <div>ModuLux Fabrication Management System v1.0</div>
                            <div>Records Found: {filteredList.length}</div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
