import { NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "products.json")

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw || "[]")
    if (id) {
      const item = Array.isArray(list) ? list.find((p: any) => p.id === id) : null
      return NextResponse.json({ item })
    }
    return NextResponse.json({ items: Array.isArray(list) ? list : [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}