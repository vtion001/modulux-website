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
            programmers: 0,
            total: list.length,
            rfqsCount: rfqs.length,
            successRate: rfqs.length > 0 ? Math.round((rfqs.filter((r: any) => r.ok).length / rfqs.length) * 100) : 100
        }
        list.forEach((f: any) => {
            if (f.category === "Cabinet Installer") counts.installers++
            else if (f.category === "CNC Cutting Services") counts.fabricators++
            else if (f.category === "CNC Programmer") counts.programmers++
        })
        return counts
    }, [list, rfqs])

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
        <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-sm group-hover:scale-110 transition-transform">
                        {f.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="font-black text-slate-900 text-[16px] tracking-tight">{f.name}</div>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${f.category
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-slate-50 text-slate-300 border-slate-100"
                                }`}>
                                {f.category || "Unclassified"}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold flex gap-3">
                            <span className="flex items-center gap-1"><span className="opacity-50 font-medium">ID:</span> {f.id}</span>
                            {f.email && <span className="flex items-center gap-1"><span className="opacity-50 font-medium">@</span> {f.email}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/admin/subcontractors?editId=${f.id}`}
                        scroll={false}
                        onClick={() => setShowFullList(false)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </Link>
                    <SaveForm action={deleteAction} onSubmitted={closeModal}>
                        <input type="hidden" name="id" value={f.id} />
                        <SubmitButton
                            confirm={`Delete ${f.name}?`}
                            type="danger"
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all border-none shadow-none bg-transparent"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </SubmitButton>
                    </SaveForm>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                    { label: 'Board', key: 'board_cut' },
                    { label: 'Edge', key: 'edge_band' },
                    { label: 'Asm', key: 'assembly' },
                    { label: 'Design', key: 'design' },
                    { label: 'Inst', key: 'install' },
                    { label: 'Cnt', key: 'countertop' }
                ].map(rate => (
                    <div key={rate.key} className="bg-[#FAFBFB] p-3 rounded-2xl border border-slate-50 text-center transition-colors group-hover:border-slate-200">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{rate.label}</div>
                        <div className="text-[13px] font-black text-primary">₱{f?.rates?.[rate.key] || 0}</div>
                        <div className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">{f?.units?.[rate.key] || 'job'}</div>
                    </div>
                ))}
            </div>

            {(f?.rates?.drawer > 0 || f?.rates?.base_cabinet > 0 || f?.rates?.wall_cabinet > 0 || f?.rates?.closet > 0) && (
                <div className="mt-3 flex gap-3 text-[10px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[8px] pt-1 border-r border-slate-200 pr-2 mr-1">Granular</span>
                    {f?.rates?.drawer > 0 && <span className="flex items-center gap-1">Draw: <b className="text-slate-700">₱{f.rates.drawer}</b></span>}
                    {f?.rates?.base_cabinet > 0 && <span className="flex items-center gap-1">Base: <b className="text-slate-700">₱{f.rates.base_cabinet}</b></span>}
                    {f?.rates?.wall_cabinet > 0 && <span className="flex items-center gap-1">Wall: <b className="text-slate-700">₱{f.rates.wall_cabinet}</b></span>}
                    {f?.rates?.closet > 0 && <span className="flex items-center gap-1">Cls: <b className="text-slate-700">₱{f.rates.closet}</b></span>}
                </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {f.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            {f.phone}
                        </div>
                    )}
                    {f.notes && (
                        <div className="text-[11px] italic font-medium text-slate-400 truncate max-w-[240px]">
                            "{f.notes}"
                        </div>
                    )}
                </div>

                <Link
                    href={`/admin/subcontractors?showRFQ=true&rfqSubId=${f.id}`}
                    scroll={false}
                    onClick={() => setShowFullList(false)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all transform active:scale-95 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    Draft RFQ
                </Link>
            </div>
            {lastById[f.id] && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-slate-300">Last communication: <span className="text-slate-400 font-black ml-1">{new Date(lastById[f.id].ts).toLocaleDateString()}</span></span>
                    <span className={lastById[f.id].ok ? "text-primary bg-primary/5 px-2 py-0.5 rounded" : "text-red-500 bg-red-50 px-2 py-0.5 rounded"}>{lastById[f.id].ok ? "Delivered" : "Attempt Failed"}</span>
                </div>
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-secondary/20 selection:text-secondary pb-20">
            {/* Sticky Header Bar */}
            <div className="bg-white/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-50">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                    <span className="text-slate-400">Operations /</span>
                    <span className="text-primary font-bold">Subcontractors</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2.5 mr-2">
                        {[11, 12, 13].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-[2.5px] border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-[2.5px] border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">+8</div>
                    </div>
                    <Link href="/admin/subcontractors?showRFQ=true" scroll={false} className="flex items-center gap-2 bg-primary hover:bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                        <span>Send RFQ</span>
                    </Link>
                    <Link href="/admin/subcontractors?showAdd=true" scroll={false} className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-5 py-2.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-secondary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                        <span>Add New</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8 space-y-10">
                {/* Hero section removed and integrated into header for cleaner look */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Search & Statistics Bar */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="relative w-full lg:w-[480px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                <input
                                    placeholder="Search subcontractors"
                                    className="w-full bg-[#FAFBFB] border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-[13px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 placeholder:text-slate-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Category</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="bg-[#FAFBFB] border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10"
                                >
                                    <option value="">All Types</option>
                                    <option value="CNC Cutting Services">CNC Cutting</option>
                                    <option value="CNC Programmer">Programmers</option>
                                    <option value="Cabinet Installer">Installers</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Subcontractors Directory
                                </h2>
                                <button
                                    onClick={() => setShowFullList(true)}
                                    className="text-[10px] font-black text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-widest transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                    Registry Viewer
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[1000px] overflow-y-auto custom-scrollbar">
                                {list.length === 0 ? (
                                    <div className="text-[13px] text-slate-400 py-20 text-center italic border border-dashed border-slate-100 rounded-[32px]">No collaborators registered in the registry.</div>
                                ) : (
                                    list.slice(0, 5).map(renderSubcontractorItem)
                                )}

                                {list.length > 5 && (
                                    <div className="pt-8 border-t border-dashed border-slate-100 flex justify-center">
                                        <button
                                            onClick={() => setShowFullList(true)}
                                            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl border border-secondary bg-white text-secondary text-[11px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white hover:shadow-[0_20px_50px_rgba(184,134,11,0.2)] transition-all group scale-100 hover:scale-[1.02] active:scale-95"
                                        >
                                            Explore Master Registry ({list.length} Partners)
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Operational Guidelines</h2>
                            </div>
                            <ul className="text-[13px] text-slate-500 space-y-4 font-medium">
                                <li className="flex gap-4 items-start">
                                    <span className="w-6 h-6 rounded-lg bg-primary/5 text-primary font-black text-[10px] flex items-center justify-center shrink-0 border border-primary/10">01</span>
                                    <span>Maintain unique identifiers to ensure integrity of the master registry.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="w-6 h-6 rounded-lg bg-primary/5 text-primary font-black text-[10px] flex items-center justify-center shrink-0 border border-primary/10">02</span>
                                    <span>Labor rates are structured by project-specific metrics (SQM, LM, JOB).</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="w-6 h-6 rounded-lg bg-primary/5 text-primary font-black text-[10px] flex items-center justify-center shrink-0 border border-primary/10">03</span>
                                    <span>All communication logs are archived for quality assurance and audit.</span>
                                </li>
                            </ul>
                            <div className="pt-6 border-t border-slate-50">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">RFQ Global Template</h3>
                                <SaveForm action={updateTemplateAction} className="space-y-3">
                                    <textarea
                                        name="rfq_template_text"
                                        placeholder="Default RFQ email body…"
                                        className="w-full p-4 border border-slate-200 rounded-xl bg-[#FAFBFB] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 text-[13px] min-h-[120px] resize-none"
                                    />
                                    <SubmitButton confirm="Save template?" className="w-full py-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transform active:scale-[0.98] transition-all shadow-lg shadow-primary/10">Save Registry Template</SubmitButton>
                                </SaveForm>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800">Recent Transactions</h2>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase">History</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                <table className="min-w-full text-[11px]">
                                    <thead className="bg-[#FAFBFB]">
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left p-3 font-black text-slate-400">Subcon</th>
                                            <th className="text-left p-3 font-black text-slate-400 text-center">Stat</th>
                                            <th className="text-right p-3 font-black text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {rfqs.slice(0, 6).map((e: any) => (
                                            <tr key={`${e.gmail_id || e.ts}-${e.to_email || e.to}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-extrabold text-slate-700 truncate max-w-[100px]">{e.name || e.subcontractor_id}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${e.ok ? "bg-primary/10 text-primary" : "bg-red-50 text-red-500"}`}>
                                                        {e.ok ? "Sent" : "Err"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right opacity-60 font-bold whitespace-nowrap">{new Date(Number(e.ts) || Date.now()).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {rfqs.length === 0 && (
                                            <tr><td className="p-6 text-slate-400 text-center italic" colSpan={3}>No activity recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.03)] ring-1 ring-slate-100/50">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                    Network Distribution
                                </h2>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{analytics.total} Active</span>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: "Cabinet Installers", count: analytics.installers, color: "bg-emerald-500", text: "text-emerald-500", progress: analytics.total > 0 ? (analytics.installers / analytics.total) * 100 : 0 },
                                    { label: "CNC Cutting", count: analytics.fabricators, color: "bg-amber-500", text: "text-amber-500", progress: analytics.total > 0 ? (analytics.fabricators / analytics.total) * 100 : 0 },
                                    { label: "Programmers", count: analytics.programmers, color: "bg-slate-900", text: "text-slate-900", progress: analytics.total > 0 ? (analytics.programmers / analytics.total) * 100 : 0 }
                                ].map((stat, idx) => (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{stat.label}</span>
                                            <span className={`text-[13px] font-black ${stat.text}`}>{stat.count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-[1px]">
                                            <div
                                                className={`h-full ${stat.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.05)]`}
                                                style={{ width: `${stat.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#FAFBFB] rounded-2xl border border-slate-50 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{analytics.successRate}%</div>
                                </div>
                                <div className="p-4 bg-[#FAFBFB] rounded-2xl border border-slate-50 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total RFQs</div>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{analytics.rfqsCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.2)] p-10 animate-in zoom-in-[0.98] duration-300 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Modify Profile</h2>
                                </div>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Editing {editItem.name} — <span className="font-mono text-primary/60">{editItem.id}</span></p>
                            </div>
                            <button onClick={closeModal} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-100 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <SaveForm action={saveAction} onSubmitted={closeModal} className="space-y-10">
                            <input type="hidden" name="id" defaultValue={editItem.id} />

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Core Identity</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Legal Entity Name</label>
                                        <input name="name" defaultValue={editItem.name} className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Email Address</label>
                                        <input name="email" type="email" defaultValue={editItem.email || ""} className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Contact Number</label>
                                        <input name="phone" defaultValue={editItem.phone || ""} className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Service Classification</label>
                                        <select name="category" defaultValue={editItem.category || ""} className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all">
                                            <option value="">Select Category</option>
                                            <option value="CNC Cutting Services">CNC Cutting Services</option>
                                            <option value="CNC Programmer">CNC Programmer</option>
                                            <option value="Cabinet Installer">Cabinet Installer</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Rate Architecture</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {['board_cut', 'edge_band', 'assembly', 'design', 'install', 'countertop'].map(rId => (
                                        <React.Fragment key={rId}>
                                            <div className="bg-[#FAFBFB] p-5 rounded-3xl border border-slate-50 space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
                                                    {rId.replace('_', ' ')}
                                                    {rId === 'install' && <span className="bg-primary/10 text-[8px] px-2 py-0.5 rounded-full">Variable</span>}
                                                </label>
                                                <div className="flex gap-3">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-black">₱</span>
                                                        <input name={rId} type="number" step="0.01" defaultValue={editItem.rates?.[rId] || 0} className="w-full pl-8 pr-4 py-3 border border-slate-100 rounded-xl bg-white text-slate-800 font-black text-sm focus:outline-none focus:ring-2 focus:ring-primary/10" />
                                                    </div>
                                                    <select name={`unit_${rId}`} defaultValue={editItem.units?.[rId] || "per job"} className="w-24 px-2 border border-slate-100 rounded-xl bg-white text-[9px] font-black uppercase focus:outline-none">
                                                        {['per job', 'per sqm', 'per linear meter', 'per feet', 'per project', 'per board', 'per module'].map(u => (
                                                            <option key={u} value={u}>{u.replace('per ', '')}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {rId === 'install' && (
                                                <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[32px] border border-dashed border-slate-200">
                                                    {['drawer', 'base_cabinet', 'wall_cabinet', 'closet'].map(sub => (
                                                        <div key={sub} className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{sub.replace('_', ' ')}</label>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-black">₱</span>
                                                                    <input name={sub} type="number" step="0.01" defaultValue={editItem.rates?.[sub] || 0} className="w-full pl-6 pr-2 py-2 border border-slate-100 rounded-lg bg-white text-slate-800 font-black text-[11px] focus:outline-none" placeholder="0" />
                                                                </div>
                                                                <select name={`unit_${sub}`} defaultValue={editItem.units?.[sub] || "per module"} className="w-14 px-1 border border-slate-100 rounded-lg bg-white text-[8px] font-black uppercase focus:outline-none">
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

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Administrative Notes</label>
                                <textarea name="notes" defaultValue={editItem.notes || ""} className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 min-h-[120px] text-[13px] resize-none" placeholder="Enter confidential notes about performance, reliability, etc..." />
                            </div>

                            <div className="flex gap-4 pt-10 justify-end items-center border-t border-slate-50">
                                <button type="button" onClick={closeModal} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 text-[13px] font-black uppercase tracking-widest transition-colors">Abort Changes</button>
                                <SubmitButton confirm={`Commit profile updates?`} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-primary transition-all transform active:scale-95 leading-none">Save Records</SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.2)] p-10 animate-in zoom-in-[0.98] duration-300 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_10px_rgba(184,134,11,0.3)]"></div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Partner Onboarding</h2>
                                </div>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Registering professional service provider</p>
                            </div>
                            <button onClick={closeModal} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-100 shadow-sm font-black">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <SaveForm action={addAction} onSubmitted={closeModal} className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Registry ID</label>
                                    <input name="id" defaultValue={nextId} required className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-primary font-black focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-mono" />
                                </div>
                                <div className="md:col-span-9 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Company / Individual Name</label>
                                    <input name="name" placeholder="Acme Fabrication & Services" required className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                                    <input name="email" type="email" placeholder="contact@provider.com" className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                                    <input name="phone" placeholder="+63 9xx..." className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Service Sphere</label>
                                    <select name="category" className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-black focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all">
                                        <option value="">Select Category</option>
                                        <option value="CNC Cutting Services">CNC Fabrication</option>
                                        <option value="CNC Programmer">Programming</option>
                                        <option value="Cabinet Installer">Installation</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Yield Configuration (Labor Rates)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {['board_cut', 'edge_band', 'assembly', 'design', 'install', 'countertop'].map(r => (
                                        <React.Fragment key={r}>
                                            <div className="bg-[#FAFBFB] p-5 rounded-3xl border border-slate-50 space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
                                                    {r.replace('_', ' ')}
                                                    {r === 'install' && <span className="bg-primary/10 text-[8px] px-2 py-0.5 rounded-full">Variable</span>}
                                                </label>
                                                <div className="flex gap-3">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-black">₱</span>
                                                        <input name={r} type="number" step="0.01" placeholder="0.00" className="w-full pl-8 pr-4 py-3 border border-slate-100 rounded-xl bg-white text-slate-800 font-black text-sm focus:outline-none focus:ring-2 focus:ring-primary/10" />
                                                    </div>
                                                    <select name={`unit_${r}`} className="w-24 px-2 border border-slate-100 rounded-xl bg-white text-[9px] font-black uppercase focus:outline-none">
                                                        {['per job', 'per sqm', 'per linear meter', 'per feet', 'per project', 'per board', 'per module'].map(u => (
                                                            <option key={u} value={u}>{u.replace('per ', '')}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {r === 'install' && (
                                                <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[32px] border border-dashed border-slate-200">
                                                    {['drawer', 'base_cabinet', 'wall_cabinet', 'closet'].map(sub => (
                                                        <div key={sub} className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{sub.replace('_', ' ')}</label>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-black">₱</span>
                                                                    <input name={sub} type="number" step="0.01" className="w-full pl-6 pr-2 py-2 border border-slate-100 rounded-lg bg-white text-slate-800 font-black text-[11px] focus:outline-none" placeholder="0" />
                                                                </div>
                                                                <select name={`unit_${sub}`} defaultValue="per module" className="w-14 px-1 border border-slate-100 rounded-lg bg-white text-[8px] font-black uppercase focus:outline-none">
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

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Onboarding Observations</label>
                                <textarea name="notes" placeholder="Initial findings, background check notes, special capabilities..." className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 min-h-[120px] text-[13px] resize-none" />
                            </div>

                            <div className="flex gap-4 pt-12 justify-end items-center border-t border-slate-50">
                                <button type="button" onClick={closeModal} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 text-[13px] font-black uppercase tracking-widest transition-colors">Discard Draft</button>
                                <SubmitButton className="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:bg-secondary/90 transition-all transform active:scale-95 leading-none">Complete Registration</SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Global RFQ Modal */}
            {showRFQ && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.2)] p-10 animate-in zoom-in-[0.98] duration-300 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dispatch RFQ</h2>
                                    <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Request for Quote — Official Protocol</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-100 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <SaveForm action={sendAction} onSubmitted={closeModal} className="space-y-10" successMessage="RFQ Sent Successfully!">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Professional</label>
                                    <select name="subcontractor_id" value={rfqSubId} onChange={(e) => setRfqSubId(e.target.value)} className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-black focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all">
                                        <option value="">Choose from registry...</option>
                                        {list.map((f: any) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Direct Outreach Email</label>
                                    <input name="email" type="email" value={rfqEmail} onChange={(e) => setRfqEmail(e.target.value)} placeholder="provider@domain.com" className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Recipient Name / Attention To</label>
                                    <input name="name" value={rfqName} onChange={(e) => setRfqName(e.target.value)} placeholder="Full name for formal address..." className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Technical Specifications (PDF)</label>
                                    <div className="relative">
                                        <input name="plan_pdf" type="file" accept="application/pdf,image/png,image/jpeg" className="w-full px-5 py-3 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-[11px] font-bold file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary transition-all cursor-pointer" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Company Credentials (PDF)</label>
                                    <div className="relative">
                                        <input name="profile_pdf" type="file" accept="application/pdf,image/png,image/jpeg" className="w-full px-5 py-3 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-[11px] font-bold file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary transition-all cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Briefing / Project Context</label>
                                <textarea name="message" placeholder="Draft your professional request here. Be specific about timelines and deliverables..." className="w-full px-5 py-5 border border-slate-100 rounded-2xl bg-[#FAFBFB] text-slate-800 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all min-h-[160px] resize-none" />
                            </div>

                            <div className="flex gap-4 pt-10 justify-end items-center border-t border-slate-50">
                                <button type="button" onClick={closeModal} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 text-[13px] font-black uppercase tracking-widest transition-colors">Discard</button>
                                <SubmitButton confirm="Execute dispatch of this RFQ package?" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-primary transition-all transform active:scale-95 leading-none flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                    Protocol Dispatch
                                </SubmitButton>
                            </div>
                        </SaveForm>
                    </div>
                </div>
            )}

            {/* Full View Modal */}
            {showFullList && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.1)] flex flex-col animate-in zoom-in-[0.98] duration-300 overflow-hidden border border-slate-100">
                        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(30,58,46,0.3)]"></div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Database Explorer</h2>
                                </div>
                                <p className="text-[13px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">Master Registry — {filteredList.length} Records Found</p>
                            </div>

                            <div className="flex flex-1 max-w-2xl items-center gap-4">
                                <div className="relative flex-1 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Scan by name, ID, or contact meta..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-slate-100 bg-[#FAFBFB] text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-5 py-3.5 rounded-2xl border border-slate-100 bg-[#FAFBFB] text-[13px] font-black text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all min-w-[200px]"
                                >
                                    <option value="">Filter All Types</option>
                                    <option value="CNC Cutting Services">CNC Fabrication</option>
                                    <option value="CNC Programmer">Programming</option>
                                    <option value="Cabinet Installer">Installation</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowFullList(false)} className="p-3.5 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-100 shadow-sm" aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[#FAFBFB]/30 custom-scrollbar overscroll-contain">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                {filteredList.map(renderSubcontractorItem)}
                            </div>
                            {filteredList.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in slide-in-from-bottom-4">
                                    <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><path d="m21 21-4.3-4.3" /><circle cx="11" cy="11" r="8" /><path d="M8 11h6" /></svg>
                                    </div>
                                    <p className="text-[15px] font-black text-slate-800 mb-1">No matching subcontractors</p>
                                    <p className="text-[13px] text-slate-400 font-medium">Try broadening your search or adjusting filters.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-10 py-6 border-t border-slate-50 bg-white flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] shrink-0">
                            <div className="flex items-center gap-6">
                                <span>ModuLux Fabrication OS</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span>Session active</span>
                            </div>
                            <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">Records Found: {filteredList.length}</div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
