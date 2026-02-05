import { supabaseServer } from "@/lib/supabase-server"
import { InquiriesFilter } from "@/components/admin/inquiries-filter"


export default async function AdminInquiriesPage() {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase
    .from("inquiries")
    .select("id,name,email,phone,message,attachments,date,status")
    .order("date", { ascending: false })
  const list = (listRaw || []) as Array<{ id: string; name: string; email: string; phone: string; message: string; attachments: any[]; date: string; status?: string }>
  
  // Calculate status counts
  const statusCounts = {
    new: list.filter(i => !i.status || i.status === "new").length,
    qualified: list.filter(i => i.status === "qualified").length,
    proposal: list.filter(i => i.status === "proposal").length,
    won: list.filter(i => i.status === "won").length,
    lost: list.filter(i => i.status === "lost").length,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inquiries</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Messages submitted from the contact form</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 text-sm">Total: {list.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Pipeline Card */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-10">
        <div className="mb-10">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary mb-0.5"></span>
            Inquiry Pipeline
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Management Funnel</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: "New", count: statusCounts.new, color: "bg-slate-50" },
            { label: "Qualified", count: statusCounts.qualified, color: "bg-blue-50" },
            { label: "Proposal", count: statusCounts.proposal, color: "bg-amber-50" },
            { label: "Won", count: statusCounts.won, color: "bg-green-50" },
            { label: "Lost", count: statusCounts.lost, color: "bg-red-50" },
          ].map((stage) => (
            <div key={stage.label} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stage.label}</span>
                <span className={`w-5 h-5 rounded-full ${stage.color} text-slate-600 text-[10px] font-black flex items-center justify-center border border-slate-200`}>
                  {stage.count}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px] bg-gradient-to-b from-slate-50/50 to-transparent rounded-lg p-3"></div>
            </div>
          ))}
        </div>
      </div>


      {list.length === 0 ? (
        <div className="text-muted-foreground">No inquiries yet</div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <InquiriesFilter inquiries={list} />
        </div>
      )}
