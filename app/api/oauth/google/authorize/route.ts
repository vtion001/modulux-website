import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const clientId = process.env.GOOGLE_CLIENT_ID || ""
    const redirectUri = `${url.origin}/api/oauth/google/callback`
    const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.send")
    const state = url.searchParams.get("state") || ""
    if (!clientId) {
      return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID" }, { status: 400 })
    }
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent${state?`&state=${encodeURIComponent(state)}`:""}`
    return NextResponse.redirect(authUrl)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}

