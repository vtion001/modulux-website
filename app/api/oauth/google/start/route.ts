import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || ""
  const scope = encodeURIComponent(["https://www.googleapis.com/auth/gmail.send", "openid", "email"].join(" "))
  const state = Math.random().toString(36).slice(2)
  if (!clientId || !redirectUri) return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI" }, { status: 500 })
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&state=${state}`
  return NextResponse.redirect(url)
}