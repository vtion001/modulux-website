"use client"
import { useMemo, useState } from "react"
import { InquiryItem } from "@/components/admin/inquiry-item"

type Inquiry = { id: string; name: string; email: string; phone: string; message: string; attachments?: any[]; date: string; status?: string; tags?: string[] }

export function InquiriesFilter({ inquiries }: { inquiries: Inquiry[] }) {
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [tag, setTag] = useState<string>("")

  const filtered = useMemo(() => {
    const start = from ? new Date(from).getTime() : 0
    const end = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : Number.MAX_SAFE_INTEGER
    const t = tag.trim().toLowerCase()
    const s = status.trim()
    return inquiries.filter((q) => {
      const ts = q.date ? new Date(q.date).getTime() : 0
      if (ts < start || ts > end) return false
      if (s && String(q.status || "") !== s) return false
      if (t) {
        const arr = Array.isArray(q.tags) ? q.tags : []
        const match = arr.some((x) => String(x || "").toLowerCase().includes(t))
        if (!match) return false
      }
      return true
    })
  }, [from, to, status, tag, inquiries])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur animate-in fade-in slide-in-from-bottom-1 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1" htmlFor="inq-from">From</label>
            <input id="inq-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1" htmlFor="inq-to">To</label>
            <input id="inq-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1" htmlFor="inq-status">Status</label>
            <select id="inq-status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Any</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1" htmlFor="inq-tag">Tag contains</label>
            <input id="inq-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g., replied" className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-end">
            <div className="w-full flex gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm" role="status" aria-live="polite">
                <span className="text-muted-foreground">Showing</span>
                <span className="font-medium text-foreground">{filtered.length}</span>
              </div>
              <button onClick={() => { setFrom(""); setTo(""); setStatus(""); setTag("") }} className="px-3 py-2 rounded-md border text-sm transition-all duration-200 hover:shadow-md" aria-label="Clear filters">Clear</button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground">No inquiries match filters</div>
        ) : (
          filtered.map((q) => <InquiryItem key={q.id} inquiry={q} />)
        )}
      </div>
    </div>
  )
}
