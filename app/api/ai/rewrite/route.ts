import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"

const globalAny: any = globalThis as any
const cache: Map<string, any> = (globalAny.__aiRewriteCache ||= new Map())
const rate: { count: number; resetAt: number } = (globalAny.__aiRewriteRate ||= { count: 0, resetAt: Date.now() + 60_000 })

const dataDir = path.join(process.cwd(), "data")
const historyFile = path.join(dataDir, "ai-rewrite-history.json")

function keyOf(mode: string, text: string, keywords: string, length: string) {
  return JSON.stringify({ mode, text: text.slice(0, 2000), keywords, length })
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function wordSet(s: string) {
  return new Set(normalize(s).split(" ").filter(Boolean))
}

function jaccard(a: string, b: string) {
  const A = wordSet(a)
  const B = wordSet(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  const union = A.size + B.size - inter
  return inter / union
}

function countWords(s: string) {
  return normalize(s).split(" ").filter(Boolean).length
}

export async function POST(req: Request) {
  try {
    const { mode, text, keywords, length } = await req.json()
    const key = process.env.OPENAI_API_KEY
    const promptBase = `You are a helpful writing assistant for a cabinet manufacturer. Tone: professional, clear, mildly persuasive.`
    const kw = String(keywords || "")
    const len = String(length || "medium").toLowerCase()
    const sizeHint = len === "short" ? "150-250 words" : len === "long" ? "500-700 words" : "250-400 words"
    const contentPrompt = mode === "compose"
      ? `${promptBase} Compose a blog article (${sizeHint}) using these keywords: ${kw}. Avoid fluff, be specific, include benefits and a closing CTA. Use 2-3 short paragraphs and a final CTA line.`
      : `${promptBase} Rewrite (${sizeHint}) the following, keeping meaning, improving clarity and flow. Weave in keywords naturally: ${kw}. Use 2-3 short paragraphs and a final CTA line. Text: ${String(text || "")}`

    const k = keyOf(String(mode), String(text || ""), kw, len)
    const now = Date.now()
    if (now > rate.resetAt) {
      rate.count = 0
      rate.resetAt = now + 60_000
    }
    if (rate.count >= 30 && !cache.has(k)) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    rate.count++

    if (cache.has(k)) {
      const cached = cache.get(k)
      return NextResponse.json(cached)
    }

    let items: Array<{ id: string; text: string; meta: any; quality: any; similarity: any; timestamp: number }> = []
    let source = "fallback"
    if (key) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: promptBase },
            { role: "user", content: contentPrompt },
          ],
          temperature: 0.7,
          n: 3,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 })
      const choices = Array.isArray(data.choices) ? data.choices.map((c: any) => c?.message?.content).filter(Boolean) : []
      source = "openai"
      items = choices.map((t: string, i: number) => {
        const words = countWords(t)
        const minWords = len === "short" ? 100 : len === "long" ? 400 : 200
        const passed = words >= minWords
        return {
          id: `v${i + 1}`,
          text: t,
          meta: { mode, keywords: kw, length: len, sizeHint },
          quality: { words, passed },
          similarity: {},
          timestamp: now,
        }
      })
    }

    // Fallback simple compose/rewrite when no API key
    if (items.length === 0) {
      const base = String(text || "").trim()
      const kwList = kw ? kw.split(/,|\s+/).filter(Boolean) : []
      const mk = (seed: string) =>
        mode === "compose"
          ? `An engaging caption (${sizeHint}) about ${kwList.join(", ")}. ${seed}. Contact us for a free consultation.`
          : `${base}\n\nRewrite (${sizeHint}) with improved clarity and keywords: ${kwList.join(", ")}. ${seed}`
      const variants = [mk("Focus on benefits and outcomes."), mk("Emphasize materials and craftsmanship."), mk("Highlight installation and aftercare." )]
      items = variants.map((t, i) => ({ id: `v${i + 1}`, text: t, meta: { mode, keywords: kw, length: len, sizeHint }, quality: { words: countWords(t), passed: true }, similarity: {}, timestamp: now }))
      source = "fallback"
    }

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const sim = jaccard(items[i].text, items[j].text)
        items[i].similarity[`to_${items[j].id}`] = sim
        items[j].similarity[`to_${items[i].id}`] = sim
      }
    }
    const dedup = items.filter((it, idx, arr) => arr.findIndex((o) => jaccard(it.text, o.text) > 0.85 && o.id !== it.id) === -1)
    const variantsOut = dedup.map((d) => d.text)

    const out = {
      text: variantsOut[0] || String(text || ""),
      variants: variantsOut,
      items: dedup,
      source,
      original: { text: String(text || "") },
      meta: { mode, keywords: kw, length: len, sizeHint, generated: dedup.length, timestamp: now },
    }

    try {
      await mkdir(dataDir, { recursive: true })
      let prev: any[] = []
      try {
        const raw = await readFile(historyFile, "utf-8")
        prev = JSON.parse(raw)
      } catch {}
      prev.unshift(out)
      await writeFile(historyFile, JSON.stringify(prev, null, 2))
    } catch {}

    cache.set(k, out)
    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to process" }, { status: 400 })
  }
}