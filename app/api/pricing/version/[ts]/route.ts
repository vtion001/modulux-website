import path from "path"
import { readFile } from "fs/promises"
import { NextResponse } from "next/server"

const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")

export async function GET(
  _req: Request,
  { params }: { params: { ts: string } }
) {
  try {
    const raw = await readFile(versionsPath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(raw || "[]") as Array<{ ts: number; data: any }>
    const targetTs = Number(params.ts)
    const found = arr.find((v) => v.ts === targetTs)
    if (!found) return NextResponse.json({ error: "Version not found" }, { status: 404 })
    return NextResponse.json(found.data, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to read versions" }, { status: 500 })
  }
}

