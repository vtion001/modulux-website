import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "inquiries.json")

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const payload = await req.json()
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw) as any[]
    const idx = list.findIndex((q) => q.id === id)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const prev = list[idx]
    const next = { ...prev }
    if (typeof payload.status === "string") next.status = payload.status
    if (Array.isArray(payload.tags)) next.tags = payload.tags
    if (payload.appendTag && typeof payload.appendTag === "string") next.tags = Array.from(new Set([...(next.tags || []), payload.appendTag]))
    if (payload.note && typeof payload.note === "string") {
      next.notes = Array.isArray(prev.notes) ? [...prev.notes, { text: payload.note, date: new Date().toISOString() }] : [{ text: payload.note, date: new Date().toISOString() }]
    }
    list[idx] = next
    await writeFile(filePath, JSON.stringify(list, null, 2))
    return NextResponse.json({ ok: true, inquiry: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update" }, { status: 400 })
  }
}