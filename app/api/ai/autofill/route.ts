import { NextResponse } from "next/server"

function clean(s: string) {
  return String(s || "").trim()
}

function capitalize(s: string) {
  const t = clean(s)
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}

function makeExcerpt(desc: string) {
  const d = clean(desc)
  if (!d) return ""
  const max = 180
  if (d.length <= max) return d
  const cut = d.slice(0, max)
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(","), cut.lastIndexOf(" "))
  return cut.slice(0, last > 60 ? last : max) + (d.length > max ? "" : "")
}

function estimateReadTime(desc: string, len: string) {
  const words = clean(desc).split(/\s+/).filter(Boolean).length
  const wpm = 200
  const mins = Math.max(1, Math.round(words / wpm))
  return `${mins} min read`
}

export async function POST(req: Request) {
  try {
    const { description, keywords, length } = await req.json()
    const key = process.env.OPENAI_API_KEY
    const desc = clean(description)
    const kw = clean(keywords)
    const len = clean(length) || "medium"

    if (key) {
      const prompt = `You will generate structured blog metadata from a description and optional keywords. Return ONLY a compact JSON object with keys: title, category, author, date, readTime, excerpt. Rules: title 6-12 words, category 1-3 words, author a team or name, date in format like "January 8, 2025", readTime like "5 min read", excerpt 1 sentence under 200 characters. Inputs:\nDescription: ${desc}\nKeywords: ${kw}\nLength: ${len}`
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.5 })
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 })
      const content = data.choices?.[0]?.message?.content || "{}"
      let fields: any = {}
      try { fields = JSON.parse(content) } catch { fields = {} }
      const out = {
        fields: {
          title: clean(fields.title),
          category: clean(fields.category),
          author: clean(fields.author),
          date: clean(fields.date),
          readTime: clean(fields.readTime),
          excerpt: clean(fields.excerpt),
        },
        source: "openai",
      }
      return NextResponse.json(out)
    }

    const title = kw ? `${capitalize(kw.split(/,|\s+/).filter(Boolean).slice(0,3).join(" "))}` : (desc ? desc.split(/\.|\n/)[0].slice(0, 60) : "")
    const category = kw ? capitalize(kw.split(/,|\s+/).filter(Boolean)[0] || "") : ""
    const author = "ModuLux Design Team"
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    const excerpt = makeExcerpt(desc)
    const readTime = estimateReadTime(desc || excerpt, len)
    return NextResponse.json({ fields: { title, category, author, date, readTime, excerpt }, source: "fallback" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to autofill" }, { status: 400 })
  }
}