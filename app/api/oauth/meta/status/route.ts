import { NextResponse } from "next/server"
import { readIntegrations } from "@/lib/integrations"

export async function GET() {
  const db = await readIntegrations()
  const meta = db.meta || null
  return NextResponse.json({ connected: !!meta, meta })
}
