import { NextResponse } from "next/server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const dataDir = path.join(process.cwd(), "data")
const storePath = path.join(dataDir, "gmail.json")

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code") || ""
    const clientId = process.env.GOOGLE_CLIENT_ID || ""
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
    const redirectUri = `${url.origin}/api/oauth/google/callback`
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })
    if (!clientId || !clientSecret) return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET" }, { status: 400 })
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data?.error || "Token exchange failed" }, { status: 500 })
    const currentRaw = await readFile(storePath, "utf-8").catch(() => "{}")
    const current = JSON.parse(currentRaw || "{}")
    current.token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      obtained_at: Date.now(),
      token_type: data.token_type,
      scope: data.scope,
    }
    await writeFile(storePath, JSON.stringify(current, null, 2))
    const adminUrl = `${url.origin}/app/admin/email` // fallback
    return NextResponse.redirect(`${url.origin}/admin/proposals?ok=gmail-connected`)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}

