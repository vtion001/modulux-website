import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || ""
  const scope = encodeURIComponent("openid email profile")
  if (!clientId || !redirectUri) return NextResponse.json({ error: "Missing client config" }, { status: 500 })
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=online&prompt=consent`
  return NextResponse.redirect(authUrl)
}
