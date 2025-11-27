"use client"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Mail, Phone, Clock, Paperclip, Tag as TagIcon, Save as SaveIcon, Reply as ReplyIcon, X, Send, CheckCircle, Hourglass, Circle, Wand2, Bot, UserPlus } from "lucide-react"
import { toast } from "sonner"

export function InquiryItem({ inquiry }: { inquiry: any }) {
  const [status, setStatus] = useState(inquiry.status || "new")
  const [tags, setTags] = useState<string>((Array.isArray(inquiry.tags) ? inquiry.tags : []).join(", "))
  const [openReply, setOpenReply] = useState(false)
  const [to, setTo] = useState<string>(inquiry.email || "")
  const [subject, setSubject] = useState<string>(`Re: ${inquiry?.message?.slice(0, 40) || "Inquiry"}`)
  const [text, setText] = useState<string>("")
  const [includeSignature, setIncludeSignature] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [crmBusy, setCrmBusy] = useState(false)
  const toRef = useRef<HTMLInputElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (openReply) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      setTimeout(() => { toRef.current?.focus() }, 0)
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault()
          setOpenReply(false)
        } else if (e.key === "Tab") {
          const root = modalRef.current
          if (!root) return
          const focusables = Array.from(root.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )).filter(el => !el.hasAttribute('disabled'))
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (!first || !last) return
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }
      }
      document.addEventListener("keydown", onKeyDown)
      return () => { document.body.style.overflow = prev }
    }
  }, [openReply])

  const aiRewrite = async () => {
    const base = (text || "").trim()
    if (!base) return
    try {
      const res = await fetch("/api/ai/rewrite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "rewrite", text: base, keywords: `${inquiry?.name||""} inquiry`, length: "medium" }) })
      if (res.ok) {
        const data = await res.json()
        const v = (Array.isArray(data?.variants) ? data.variants[0] : (data?.text || base)) || base
        setText(v)
        return
      }
    } catch {}
    setText(base)
  }

  const aiReply = async () => {
    const name = String(inquiry.name || "").trim() || "there"
    const msg = String(inquiry.message || "").trim()
    const attachments = Array.isArray(inquiry.attachments) ? inquiry.attachments : []
    const basePrompt = `Client message: ${msg}\nAttachments: ${attachments.map(a=>a.name).join(", ")}`
    try {
      const res = await fetch("/api/ai/rewrite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "compose", text: basePrompt, keywords: "quote request, next steps, schedule", length: "medium" }) })
      if (res.ok) {
        const data = await res.json()
        const v = (Array.isArray(data?.variants) ? data.variants[0] : (data?.text || ""))
        if (v) {
          setSubject(subject || `Re: ${msg.slice(0, 60)}`)
          setText(v)
          return
        }
      }
    } catch {}
    const body = `Hi ${name},\n\nThanks for reaching out${msg ? ` about: \"${msg}\"` : ""}. We’d be happy to provide a detailed quotation. Could you share:\n\n• Approximate dimensions and materials\n• Budget range and preferred timeline\n• Any reference photos or plans\n\nWe can also hop on a quick call to align requirements and next steps.\n\nLooking forward to your reply.\n\nBest regards,\n`
    setSubject(subject || `Re: ${msg.slice(0, 60)}`)
    setText(body)
  }

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

  const captureToCRM = async () => {
    if (crmBusy) return
    setCrmBusy(true)
    try {
      const payload = {
        name: String(inquiry.name || "").trim(),
        email: String(inquiry.email || "").trim(),
        phone: String(inquiry.phone || "").trim(),
        company: String(inquiry.company || "").trim(),
        source: "Inquiry",
        notes: String(inquiry.message || "").trim(),
      }
      const res = await fetch("/api/crm/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      toast.success("Captured to CRM")
      await fetch(`/api/inquiries/${inquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appendTag: "crm" }) })
    } catch (e: any) {
      toast.error(e?.message || "Capture failed")
    } finally {
      setCrmBusy(false)
    }
  }

  return (
    <div className="group relative bg-card border border-border/60 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent rounded-2xl pointer-events-none" />
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
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(inquiry.date).toLocaleString()}</div>
          <button type="button" onClick={captureToCRM} disabled={crmBusy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs transition-all hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"><UserPlus className="w-3.5 h-3.5" />Capture to CRM</button>
        </div>
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
        <button type="button" onClick={saveMeta} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition-all hover:shadow-md"><SaveIcon className="w-4 h-4" />Save</button>
        <button type="button" onClick={() => setOpenReply(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition-all hover:shadow-md" aria-label="Reply to inquiry"><ReplyIcon className="w-4 h-4" />Reply</button>
      </div>
      {openReply && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={`reply-title-${inquiry.id}`}> 
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpenReply(false)} aria-hidden="true" />
          <div ref={modalRef} className="relative z-[1001] w-[95%] max-w-4xl animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="rounded-t-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 flex items-center justify-between">
              <div>
                <div id={`reply-title-${inquiry.id}`} className="text-base md:text-lg font-semibold">Compose Reply</div>
                <div className="text-xs md:text-sm opacity-90">To {inquiry.name} • {inquiry.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowPreview(v => !v)} className="px-3 py-2 rounded-md border border-white/20 text-xs md:text-sm hover:bg-white/10 transition-all">{showPreview ? "Hide Preview" : "Show Preview"}</button>
                <button type="button" onClick={() => setOpenReply(false)} className="px-3 py-2 rounded-md border border-white/20 text-xs md:text-sm"><X className="w-4 h-4" /> Close</button>
              </div>
            </div>
            <div className="bg-card border-x border-b border-border rounded-b-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1" htmlFor={`reply-to-${inquiry.id}`}>To</label>
                    <input ref={toRef} id={`reply-to-${inquiry.id}`} value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1" htmlFor={`reply-subject-${inquiry.id}`}>Subject</label>
                    <input id={`reply-subject-${inquiry.id}`} value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1" htmlFor={`reply-message-${inquiry.id}`}>Message</label>
                    <textarea id={`reply-message-${inquiry.id}`} value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border/40 bg-background min-h-40 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <input id={`reply-include-signature-${inquiry.id}`} type="checkbox" checked={includeSignature} onChange={(e) => setIncludeSignature(e.target.checked)} className="mr-2" /> Include signature
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setOpenReply(false)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition-all hover:shadow-md"><X className="w-4 h-4" />Cancel</button>
                      <button type="button" onClick={sendReply} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-primary text-white transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed">{busy ? "Sending…" : <><Send className="w-4 h-4" />Send</>}</button>
                    </div>
                  </div>
                </div>
                {showPreview && (
                  <div className="md:col-span-2">
                    <div className="rounded-xl border border-border/40 bg-background p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-foreground">Preview</div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={aiRewrite} disabled={!String(text||"").trim()} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs transition-all hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"><Wand2 className="w-3.5 h-3.5" />AI Rewrite</button>
                          <button type="button" onClick={aiReply} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs transition-all hover:shadow-sm"><Bot className="w-3.5 h-3.5" />AI Reply</button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">Subject</div>
                      <div className="text-sm mb-3">{subject}</div>
                      <div className="text-xs text-muted-foreground mb-2">Message</div>
                      <div className="text-sm whitespace-pre-wrap">{text || ""}</div>
                      {includeSignature && (
                        <div className="mt-4 text-xs text-muted-foreground">Signature will be appended</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
