import { NextResponse } from "next/server"
import path from "path"
import { mkdir, writeFile } from "fs/promises"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    const key = process.env.OPENAI_API_KEY
    const p = String(prompt || "modern kitchen cabinets, luxury finish")

    if (key) {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: p,
          size: "1024x1024",
          n: 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 })
      const first = data.data?.[0] || {}
      const url = first.url
      if (url) return NextResponse.json({ url, source: "openai" })
      const b64 = first.b64_json
      if (typeof b64 === "string" && b64.length) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        await mkdir(uploadsDir, { recursive: true })
        const fileName = `ai-${Date.now()}.png`
        const dest = path.join(uploadsDir, fileName)
        await writeFile(dest, Buffer.from(b64, "base64"))
        return NextResponse.json({ url: `/uploads/${fileName}`, source: "openai" })
      }
      return NextResponse.json({ error: "No image returned" }, { status: 500 })
    }
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to generate" }, { status: 400 })
  }
}