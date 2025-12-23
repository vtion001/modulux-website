import { NextResponse } from "next/server"
import { sendGmail } from "@/lib/gmail"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = await sendGmail(body)
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}
