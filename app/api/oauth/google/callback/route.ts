import { NextResponse } from "next/server"
import path from "path"
import { cookies } from "next/headers"
import { signSession } from "@/lib/auth"

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
  const idToken = String(data.id_token || "")
  let profile: any = {}
  try {
    const parts = idToken.split(".")
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"))
      profile = { email: payload.email, name: payload.name, picture: payload.picture, sub: payload.sub }
    }
  } catch {}
  const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || ""
  if (allowedDomain && profile.email && !profile.email.endsWith(`@${allowedDomain}`)) {
    return NextResponse.redirect("/admin/login?error=domain")
  }
  const token = signSession({ provider: "google", email: profile.email, name: profile.name, picture: profile.picture, ts: Date.now() })
  cookies().set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  return NextResponse.redirect("/admin")
}
