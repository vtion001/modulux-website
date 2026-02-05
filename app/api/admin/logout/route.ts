import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Delete the admin session cookie
    const cookieStore = await cookies()
    cookieStore.delete("admin_session")

    // Return a response with redirect
    return NextResponse.json(
      { ok: true, message: "Logged out successfully" },
      {
        status: 200,
        headers: {
          "Set-Cookie": "admin_session=; Max-Age=0; Path=/; HttpOnly",
        },
      }
    )
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { ok: false, error: "Logout failed" },
      { status: 500 }
    )
  }
}
