import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "conversations.json")

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw || "[]")
    const idx = list.findIndex((c: any) => c.id === id)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const convo = list[idx]
    if (typeof body.status === "string") convo.status = body.status
    if (Array.isArray(body.tags)) convo.tags = body.tags
    if (typeof body.appendText === "string") convo.messages.push({ from: "agent", text: body.appendText, date: Date.now() })
    list[idx] = convo
    await writeFile(filePath, JSON.stringify(list, null, 2))
    return NextResponse.json({ ok: true, conversation: convo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}