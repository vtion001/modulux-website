import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "social.json")

export async function GET() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  return NextResponse.json({ posts: Array.isArray(list) ? list : [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const content = String(body.content || "").trim()
    const platforms = Array.isArray(body.platforms) ? body.platforms : []
    const schedule = String(body.schedule || "").trim()
    if (!content || platforms.length === 0) return NextResponse.json({ error: "Missing content or platforms" }, { status: 400 })
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw || "[]")
    const post = { id: `sp_${Date.now()}`, content, platforms, schedule, status: schedule ? "scheduled" : "draft", created_at: Date.now() }
    list.unshift(post)
    await writeFile(filePath, JSON.stringify(list, null, 2))
    return NextResponse.json({ ok: true, post })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}