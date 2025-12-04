import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const dataDir = path.join(process.cwd(), "data")
const storePath = path.join(dataDir, "gmail.json")
const emailCfgPath = path.join(dataDir, "email.json")

async function getToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
  const envRefresh = process.env.GOOGLE_REFRESH_TOKEN || ""
  if (clientId && clientSecret && envRefresh) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: envRefresh, grant_type: "refresh_token" }),
    })
    const data = await res.json()
    if (!res.ok) return null
    return String(data.access_token || "") || null
  }
  const raw = await readFile(storePath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw)
  const t = cfg?.token
  if (!t) return null
  const expiresAt = t.obtained_at + (t.expires_in || 0) * 1000 - 60_000
  if (Date.now() < expiresAt) return t.access_token
  const refreshToken = t.refresh_token
  if (!refreshToken || !clientId || !clientSecret) return null
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  })
  const data = await res.json()
  if (!res.ok) return null
  return String(data.access_token || "") || null
}

function buildMime({ from, to, subject, text, html, replyTo, bcc, attachments }: { from: string; to: string; subject: string; text?: string; html?: string; replyTo?: string; bcc?: string; attachments?: Array<{ filename: string; content_base64: string; mime?: string }> }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
  ]
  if (replyTo) headers.push(`Reply-To: ${replyTo}`)
  if (bcc) headers.push(`Bcc: ${bcc}`)

  const hasAttachments = Array.isArray(attachments) && attachments.length > 0
  if (!hasAttachments) {
    if (html) headers.push(`Content-Type: text/html; charset="UTF-8"`)
    else headers.push(`Content-Type: text/plain; charset="UTF-8"`)
    const body = html || text || ""
    return headers.join("\r\n") + "\r\n\r\n" + body
  }

  const boundary = `mixed_${Date.now()}`
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  const parts: string[] = []
  const bodyHeaders = html
    ? [`Content-Type: text/html; charset="UTF-8"`, `Content-Transfer-Encoding: 7bit`]
    : [`Content-Type: text/plain; charset="UTF-8"`, `Content-Transfer-Encoding: 7bit`]
  parts.push(`--${boundary}\r\n${bodyHeaders.join("\r\n")}\r\n\r\n${html || text || ""}\r\n`)
  for (const att of attachments || []) {
    const mime = att.mime || "application/octet-stream"
    const filename = att.filename || "attachment"
    const content = att.content_base64 || ""
    parts.push(
      `--${boundary}\r\n` +
      `Content-Type: ${mime}; name="${filename}"\r\n` +
      `Content-Disposition: attachment; filename="${filename}"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      `${content}\r\n`
    )
  }
  parts.push(`--${boundary}--`)
  return headers.join("\r\n") + "\r\n\r\n" + parts.join("")
}

export async function POST(req: Request) {
  try {
    const { to, subject, text, html, attachments, from, includeSignature } = await req.json()
    const token = await getToken()
    if (!token) return NextResponse.json({ error: "Gmail not connected" }, { status: 500 })
    const cfgRaw = await readFile(emailCfgPath, "utf-8").catch(() => "{}")
    const cfg = JSON.parse(cfgRaw || "{}")
    const fromName = String(cfg.from_name || "ModuLux")
    const fromEmail = String(from || cfg.from_email || process.env.ADMIN_EMAIL || "admin@example.com")
    const replyTo = String(cfg.reply_to || fromEmail)
    const bcc = String(cfg.bcc || "")
    const sig = includeSignature === false ? "" : String(cfg.signature_text || "")
    const bodyText = (text ? String(text || "") : undefined)
    const bodyHtml = (html ? String(html || "") : undefined)
    const raw = buildMime({
      from: `${fromName} <${fromEmail}>`,
      to: String(to),
      subject: String(subject),
      text: bodyText ? bodyText + sig : undefined,
      html: bodyHtml ? bodyHtml + sig : undefined,
      replyTo,
      bcc,
      attachments: Array.isArray(attachments) ? attachments : undefined,
    })
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
