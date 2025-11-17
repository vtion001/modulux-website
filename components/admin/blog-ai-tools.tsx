"use client"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Wand2, Image as ImageIcon } from "lucide-react"

export function BlogAiTools({ descriptionName, imageName }: { descriptionName: string; imageName: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [keywords, setKeywords] = useState("")
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [busy, setBusy] = useState<null | string>(null)
  const [variants, setVariants] = useState<string[]>([])
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const getField = (name: string): HTMLInputElement | HTMLTextAreaElement | null => {
    const scope = rootRef.current?.closest("form") || rootRef.current || document
    return (scope.querySelector(`[name="${name}"]`) as any) || null
  }

  const setFieldValue = (el: HTMLInputElement | HTMLTextAreaElement | null, value: string) => {
    if (!el) return
    el.value = value
    try {
      el.dispatchEvent(new Event("input", { bubbles: true }))
      el.dispatchEvent(new Event("change", { bubbles: true }))
    } catch {}
  }

  const rewrite = async (mode: "rewrite" | "compose") => {
    const descEl = getField(descriptionName)
    const text = descEl?.value || ""
    if (mode === "rewrite" && !text.trim()) {
      toast.error("Write something first to rewrite")
      return
    }
    setBusy(mode)
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text, keywords, length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to rewrite")
      const outs = Array.isArray(data?.variants) ? data.variants : [data?.text || text]
      const structured = Array.isArray(data?.items) ? data.items : []
      setVariants(outs.filter(Boolean))
      setItems(structured)
      setOpen(true)
      toast.success("Suggestions ready")
    } catch (e: any) {
      toast.error(e.message || "Rewrite failed")
    } finally {
      setBusy(null)
    }
  }

  const generateImage = async () => {
    const imgEl = getField(imageName)
    const descEl = getField(descriptionName)
    const prompt = (descEl?.value || keywords || "").trim()
    if (!prompt) {
      toast.error("Write a description or add keywords")
      return
    }
    setBusy("image")
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to generate image")
      setFieldValue(imgEl, data.url)
      toast.success("Image generated")
    } catch (e: any) {
      toast.error(e.message || "Image generation failed")
    } finally {
      setBusy(null)
    }
  }

  const autofill = async () => {
    const titleEl = getField("title")
    const categoryEl = getField("category")
    const authorEl = getField("author")
    const dateEl = getField("date")
    const readTimeEl = getField("readTime")
    const excerptEl = getField("excerpt")
    const descEl = getField(descriptionName)
    const payload = { description: descEl?.value || "", keywords, length }
    setBusy("autofill")
    try {
      const res = await fetch("/api/ai/autofill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to autofill")
      const f = data?.fields || {}
      setFieldValue(titleEl, String(f.title || titleEl?.value || ""))
      setFieldValue(categoryEl, String(f.category || categoryEl?.value || ""))
      setFieldValue(authorEl, String(f.author || authorEl?.value || ""))
      setFieldValue(dateEl, String(f.date || dateEl?.value || ""))
      setFieldValue(readTimeEl, String(f.readTime || readTimeEl?.value || ""))
      setFieldValue(excerptEl, String(f.excerpt || excerptEl?.value || ""))
      toast.success("Autofilled fields")
    } catch (e: any) {
      toast.error(e.message || "Autofill failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={rootRef} className="border border-border/40 rounded-md p-3 relative">
      <div className="text-xs text-muted-foreground mb-2">AI Assistant</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords (e.g., modern kitchen, penthouse)"
          className="w-full p-2 border border-border/40 rounded"
        />
        <select
          value={length}
          onChange={(e) => setLength(e.target.value as any)}
          className="w-full p-2 border border-border/40 rounded"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => rewrite("rewrite")}
            disabled={busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/40 transition-all hover:shadow-md"
          >
            {busy === "rewrite" ? <Wand2 className="w-4 h-4 animate-pulse" /> : <Wand2 className="w-4 h-4" />} {busy === "rewrite" ? "Generating..." : "Rewrite"}
          </button>
          <button
            type="button"
            onClick={() => rewrite("compose")}
            disabled={busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/40 transition-all hover:shadow-md"
          >
            {busy === "compose" ? <Wand2 className="w-4 h-4 animate-pulse" /> : <Wand2 className="w-4 h-4" />} {busy === "compose" ? "Generating..." : "Compose"}
          </button>
          <button
            type="button"
            onClick={generateImage}
            disabled={busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/40 transition-all hover:shadow-md"
          >
            {busy === "image" ? <ImageIcon className="w-4 h-4 animate-pulse" /> : <ImageIcon className="w-4 h-4" />} {busy === "image" ? "Generating..." : "Image"}
          </button>
          <button
            type="button"
            onClick={autofill}
            disabled={busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/40 transition-all hover:shadow-md"
          >
            {busy === "autofill" ? <Wand2 className="w-4 h-4 animate-pulse" /> : <Wand2 className="w-4 h-4" />} {busy === "autofill" ? "Filling..." : "Autofill"}
          </button>
        </div>
      </div>
      {open && variants.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-4 max-w-2xl w-[90%]">
            <div className="text-lg font-semibold mb-3">Choose a rewrite</div>
            <div className="space-y-3 max-h-[50vh] overflow-auto">
              {(items.length ? items : variants.map((v, i) => ({ id: `v${i+1}`, text: v, meta: {}, quality: {} }))).map((it: any, i: number) => (
                <div key={it.id || i} className="rounded-md border border-border/40">
                  <div className="px-3 py-2 text-xs text-muted-foreground flex justify-between">
                    <div>{String(it?.meta?.length || "").toUpperCase()} • {String(it?.meta?.mode || "")} • {String(it?.meta?.keywords || "")}</div>
                    <div>{typeof it?.quality?.words === "number" ? `${it.quality.words} words` : ""}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const descEl = getField(descriptionName)
                      setFieldValue(descEl, it.text || variants[i])
                      setOpen(false)
                      toast.success("Applied rewrite")
                    }}
                    className="text-left w-full p-3"
                  >
                    {it.text || variants[i]}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md border">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}