import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "conversations.json")

export async function GET() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  return NextResponse.json({ conversations: Array.isArray(list) ? list : [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const platform = String(body.platform || "").trim()
    const client = String(body.client || "").trim()
    const text = String(body.text || "").trim()
    if (!platform || !client || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw || "[]")
    const id = `cv_${Date.now()}`
    const convo = { id, platform, client, status: "open", tags: [], messages: [{ from: "client", text, date: Date.now() }] }
    list.unshift(convo)
    await writeFile(filePath, JSON.stringify(list, null, 2))
    return NextResponse.json({ ok: true, conversation: convo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}