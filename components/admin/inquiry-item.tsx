"use client"
import { useState } from "react"
import { Mail, Phone, Clock, Paperclip, Tag as TagIcon, Save as SaveIcon, Reply as ReplyIcon, X, Send, CheckCircle, Hourglass, Circle } from "lucide-react"

export function InquiryItem({ inquiry }: { inquiry: any }) {
  const [status, setStatus] = useState(inquiry.status || "new")
  const [tags, setTags] = useState<string>((Array.isArray(inquiry.tags) ? inquiry.tags : []).join(", "))
  const [openReply, setOpenReply] = useState(false)
  const [to, setTo] = useState<string>(inquiry.email || "")
  const [subject, setSubject] = useState<string>(`Re: ${inquiry?.message?.slice(0, 40) || "Inquiry"}`)
  const [text, setText] = useState<string>("")
  const [includeSignature, setIncludeSignature] = useState(true)
  const [busy, setBusy] = useState(false)

  const saveMeta = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, tags: tags.split(",").map((s) => s.trim()).filter(Boolean) }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Update failed")
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/gmail/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, text, includeSignature }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Send failed")
      setOpenReply(false)
      setStatus("in_progress")
      await fetch(`/api/inquiries/${inquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress", appendTag: "replied" }) })
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="group relative bg-card border border-border/60 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent rounded-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground font-medium">
            {String(inquiry.name || "").trim().charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground">{inquiry.name}</div>
              {status === "new" && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600"><Circle className="w-3 h-3" />New</span>)}
              {status === "in_progress" && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600"><Hourglass className="w-3 h-3" />In Progress</span>)}
              {status === "closed" && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3" />Closed</span>)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" />{inquiry.email}</span>
              <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" />{inquiry.phone}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(inquiry.date).toLocaleString()}</div>
      </div>
      <div className="relative mt-3 whitespace-pre-wrap text-sm text-foreground/90">{inquiry.message}</div>
      {Array.isArray(inquiry.attachments) && inquiry.attachments.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Paperclip className="w-3 h-3" />Attachments</div>
          <div className="flex flex-wrap gap-2">
            {inquiry.attachments.map((a: any, i: number) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs transition-all hover:shadow-sm">
                <span className="truncate max-w-[180px]">{a.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">Tags</label>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs text-muted-foreground"><TagIcon className="w-3 h-3" />CSV</div>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" className="flex-1 px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={saveMeta} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition-all hover:shadow-md"><SaveIcon className="w-4 h-4" />Save</button>
        <button onClick={() => setOpenReply(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition-all hover:shadow-md"><ReplyIcon className="w-4 h-4" />Reply</button>
      </div>
      {openReply && (
        <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Message</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background min-h-28 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              <input type="checkbox" checked={includeSignature} onChange={(e) => setIncludeSignature(e.target.checked)} className="mr-2" /> Include signature
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpenReply(false)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border"><X className="w-4 h-4" />Cancel</button>
              <button onClick={sendReply} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary text-white"><Send className="w-4 h-4" />Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
