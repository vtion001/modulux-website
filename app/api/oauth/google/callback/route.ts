import { NextResponse } from "next/server"
import path from "path"
import { writeFile, readFile, mkdir } from "fs/promises"

const storePath = path.join(process.cwd(), "data", "gmail.json")

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || ""
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: "Missing client config" }, { status: 500 })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data?.error || "Token exchange failed" }, { status: 500 })
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  let prev: any = {}
  try { prev = JSON.parse(await readFile(storePath, "utf-8")) } catch {}
  const next = { ...prev, token: { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in, scope: data.scope, token_type: data.token_type, obtained_at: Date.now() } }
  await writeFile(storePath, JSON.stringify(next, null, 2))
  return NextResponse.redirect("/admin/inquiries")
}