import { NextResponse } from "next/server"
import { writeIntegration } from "@/lib/integrations"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = String(searchParams.get("code") || "")
    const appId = process.env.META_APP_ID || ""
    const appSecret = process.env.META_APP_SECRET || ""
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    const redirectUri = baseUrl ? `${baseUrl}/api/oauth/meta/callback` : ""
    if (!code || !appId || !appSecret || !redirectUri) {
      if (baseUrl) {
        return NextResponse.redirect(`${baseUrl}/admin/social?connected=meta_error`)
      }
      return NextResponse.json({ ok: false, error: "Missing OAuth configuration" }, { status: 400 })
    }

    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token")
    tokenUrl.searchParams.set("client_id", appId)
    tokenUrl.searchParams.set("client_secret", appSecret)
    tokenUrl.searchParams.set("redirect_uri", redirectUri)
    tokenUrl.searchParams.set("code", code)

    const res = await fetch(tokenUrl.toString(), { method: "GET" })
    const json = await res.json() as any
    const access_token = String(json?.access_token || "")
    const token_type = String(json?.token_type || "bearer")
    const expires_in = Number(json?.expires_in || 0)

    if (!access_token) {
      if (baseUrl) {
        return NextResponse.redirect(`${baseUrl}/admin/social?connected=meta_error`)
      }
      return NextResponse.json({ ok: false, error: "Token exchange failed" }, { status: 400 })
    }

    await writeIntegration("meta", { access_token, token_type, expires_in, updated_at: Date.now() })
    return NextResponse.redirect(`${baseUrl}/admin/social?connected=meta`)
  } catch (e) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    if (baseUrl) {
      return NextResponse.redirect(`${baseUrl}/admin/social?connected=meta_error`)
    }
    return NextResponse.json({ ok: false, error: "OAuth error" }, { status: 400 })
  }
}
