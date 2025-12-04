import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const dataDir = path.join(process.cwd(), "data")
const profilePath = path.join(dataDir, "profile.json")

export async function GET() {
  try {
    const raw = await readFile(profilePath, "utf-8").catch(() => "{}")
    const cfg = JSON.parse(raw || "{}")
    const name = String(cfg?.name || "John Doe")
    const role = String(cfg?.role || "Administrator")
    const email = String(cfg?.email || process.env.ADMIN_EMAIL || "sales@modulux.ph")
    const avatar_url = String(cfg?.avatar_url || "")
    const initials = String(cfg?.initials || (name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()))
    return NextResponse.json({ ok: true, profile: { name, role, email, avatar_url, initials } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = await readFile(profilePath, "utf-8").catch(() => "{}")
    const current = JSON.parse(raw || "{}")
    const next = { ...current, ...body }
    await writeFile(profilePath, JSON.stringify(next, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Failed" }, { status: 500 })
  }
}

