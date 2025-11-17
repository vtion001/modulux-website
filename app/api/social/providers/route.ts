import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "social-providers.json")

export async function GET() {
  const raw = await readFile(filePath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw || "{}")
  return NextResponse.json({ providers: cfg })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const raw = await readFile(filePath, "utf-8").catch(() => "{}")
    const prev = JSON.parse(raw || "{}")
    const next = { ...prev, ...body }
    await writeFile(filePath, JSON.stringify(next, null, 2))
    return NextResponse.json({ ok: true, providers: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}