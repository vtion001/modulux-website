import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  cookies().delete("admin_session")
  return NextResponse.redirect(new URL("/admin/login", request.url))
}
