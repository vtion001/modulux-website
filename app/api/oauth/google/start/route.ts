import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || ""
  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "openid",
    "email",
    "profile",
  ]
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing client config" }, { status: 500 })
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", scopes.join(" "))
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  return NextResponse.redirect(url.toString())
}

