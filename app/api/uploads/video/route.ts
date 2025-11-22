import path from "path"
import { mkdir, writeFile } from "fs/promises"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("video") as File | null
    if (!file || typeof file !== "object" || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 })
    }
    const allowed = new Set(["video/mp4", "video/webm", "video/quicktime"])
    if (!allowed.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Unsupported file type" }, { status: 415 })
    }
    const maxBytes = 200 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, error: "File too large" }, { status: 413 })
    }
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos")
    await mkdir(uploadsDir, { recursive: true })
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase() : (file.type === "video/quicktime" ? ".mov" : file.type === "video/webm" ? ".webm" : ".mp4")
    const safe = Math.random().toString(36).slice(2)
    const name = `video-${Date.now()}-${safe}${ext}`
    const dest = path.join(uploadsDir, name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(dest, buffer)
    const url = `/uploads/videos/${name}`
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 })
  }
}