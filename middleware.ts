import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

async function verifySessionEdge(token: string) {
  try {
    const secret = process.env.SESSION_SECRET || ""
    if (!secret) return null
    const parts = token.split(".")
    if (parts.length !== 2) return null
    const [data, sig] = parts
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data))
    const u8 = new Uint8Array(signature)
    let bin = ""
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
    const b64 = btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
    if (b64 !== sig) return null
    let payloadStr = data.replace(/-/g, "+").replace(/_/g, "/")
    const pad = payloadStr.length % 4
    if (pad) payloadStr += "=".repeat(4 - pad)
    const jsonBin = atob(payloadStr)
    const bytes = Uint8Array.from(jsonBin, (c) => c.charCodeAt(0))
    const payload = new TextDecoder().decode(bytes)
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  if (!pathname.startsWith("/admin")) return NextResponse.next()
  if (pathname.startsWith("/admin/login")) return NextResponse.next()
  const cookie = req.cookies.get("admin_session")?.value
  const verified = cookie ? await verifySessionEdge(cookie) : null
  if (!verified) {
    const url = new URL("/admin/login", req.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}