import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const postsPath = path.join(process.cwd(), "data", "social.json")
const providersPath = path.join(process.cwd(), "data", "social-providers.json")

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    const postsRaw = await readFile(postsPath, "utf-8").catch(() => "[]")
    const list = JSON.parse(postsRaw || "[]")
    const idx = list.findIndex((p: any) => p.id === id)
    if (idx === -1) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    const post = list[idx]
    const cfgRaw = await readFile(providersPath, "utf-8").catch(() => "{}")
    const providers = JSON.parse(cfgRaw || "{}")
    const results: any[] = []
    for (const platform of post.platforms || []) {
      const token = providers?.[platform]?.token || providers?.[platform]?.access_token
      const ok = !!token
      results.push({ platform, ok })
    }
    post.status = results.every((r) => r.ok) ? "sent" : "partial"
    post.sent_at = Date.now()
    post.results = results
    list[idx] = post
    await writeFile(postsPath, JSON.stringify(list, null, 2))
    return NextResponse.json({ ok: true, post })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}