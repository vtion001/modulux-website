import { NextResponse } from "next/server"
import path from "path"
import { mkdir, readFile, writeFile } from "fs/promises"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = `proposal_${Date.now()}`
    const data = {
      id,
      client: body?.client || { name: "", email: "", company: "" },
      title: String(body?.title || "Proposal"),
      items: Array.isArray(body?.items) ? body.items : [],
      taxRate: Number(body?.taxRate || 0),
      discount: Number(body?.discount || 0),
      notes: String(body?.notes || ""),
      created_at: Date.now(),
    }
    const dir = path.join(process.cwd(), "data")
    const filePath = path.join(dir, "proposals.json")
    await mkdir(dir, { recursive: true })
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(raw || "[]")
    arr.unshift(data)
    await writeFile(filePath, JSON.stringify(arr, null, 2))
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

