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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full p-2 border border-border/40 rounded" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full p-2 border border-border/40 rounded" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border border-border/40 rounded">
            <option value="">Any</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Tag contains</label>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g., replied" className="w-full p-2 border border-border/40 rounded" />
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