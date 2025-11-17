"use client"
import { useState } from "react"

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
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{inquiry.name}</div>
        <div className="text-xs text-muted-foreground">{new Date(inquiry.date).toLocaleString()}</div>
      </div>
      <div className="text-sm text-muted-foreground">{inquiry.email} • {inquiry.phone}</div>
      <div className="mt-2 whitespace-pre-wrap">{inquiry.message}</div>
      {Array.isArray(inquiry.attachments) && inquiry.attachments.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Attachments</div>
          <div className="flex flex-wrap gap-2">
            {inquiry.attachments.map((a: any, i: number) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-2 py-1 rounded-md border text-sm">
                <span>{a.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border border-border/40 rounded">
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">Tags</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" className="w-full p-2 border border-border/40 rounded" />
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={saveMeta} disabled={busy} className="px-3 py-2 rounded-md border">Save</button>
        <button onClick={() => setOpenReply(true)} className="px-3 py-2 rounded-md border">Reply</button>
      </div>
      {openReply && (
      <div className="mt-3 border border-border/40 rounded p-3 space-y-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Message</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-2 border border-border/40 rounded min-h-24" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpenReply(false)} className="px-3 py-2 rounded-md border">Cancel</button>
            <div className="flex items-center mr-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={includeSignature} onChange={(e) => setIncludeSignature(e.target.checked)} className="mr-2" /> Include signature
            </div>
            <button onClick={sendReply} disabled={busy} className="px-3 py-2 rounded-md border bg-primary text-white">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}