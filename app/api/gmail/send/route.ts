import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const dataDir = path.join(process.cwd(), "data")
const storePath = path.join(dataDir, "gmail.json")
const emailCfgPath = path.join(dataDir, "email.json")

async function getToken() {
  const raw = await readFile(storePath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw)
  const t = cfg?.token
  if (!t) return null
  const expiresAt = t.obtained_at + (t.expires_in || 0) * 1000 - 60_000
  if (Date.now() < expiresAt) return t.access_token
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
  const refreshToken = t.refresh_token
  if (!refreshToken || !clientId || !clientSecret) return null
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  })
  const data = await res.json()
  if (!res.ok) return null
  cfg.token.access_token = data.access_token
  cfg.token.expires_in = data.expires_in
  cfg.token.obtained_at = Date.now()
  await writeFile(storePath, JSON.stringify(cfg, null, 2))
  return cfg.token.access_token
}

function rfc822(from: string, to: string, subject: string, text: string, replyTo?: string, bcc?: string) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
  ]
  if (replyTo) headers.push(`Reply-To: ${replyTo}`)
  if (bcc) headers.push(`Bcc: ${bcc}`)
  return headers.join("\r\n") + "\r\n\r\n" + text
}

export async function POST(req: Request) {
  try {
    const { to, subject, text, from, includeSignature } = await req.json()
    const token = await getToken()
    if (!token) return NextResponse.json({ error: "Gmail not connected" }, { status: 500 })
    const cfgRaw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
    const cfg = JSON.parse(cfgRaw || "{}")
    const fromName = String(cfg.from_name || "ModuLux")
    const fromEmail = String(from || cfg.from_email || process.env.ADMIN_EMAIL || "admin@example.com")
    const replyTo = String(cfg.reply_to || fromEmail)
    const bcc = String(cfg.bcc || "")
    const sig = includeSignature === false ? "" : String(cfg.signature_text || "")
    const body = String(text || "") + sig
    const raw = rfc822(`${fromName} <${fromEmail}>`, String(to), String(subject), body, replyTo, bcc)
    const base64 = Buffer.from(raw, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_")
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: base64 }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data?.error || "Send failed" }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}