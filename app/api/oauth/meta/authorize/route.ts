import { NextResponse } from "next/server"

export async function GET() {
  const appId = process.env.META_APP_ID || ""
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
  const redirectUri = baseUrl ? `${baseUrl}/api/oauth/meta/callback` : ""
  const scope = [
    "pages_manage_metadata",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",")

  if (!appId || !redirectUri) {
    return NextResponse.json({ ok: false, error: "Missing META_APP_ID or NEXT_PUBLIC_BASE_URL" }, { status: 400 })
  }

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", scope)

  return NextResponse.redirect(url.toString())
}
