import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
    try {
        const supabase = supabaseServer()
        const { data: cfg } = await supabase.from("email_config").select("*").eq("id", "default").single()
        return NextResponse.json(cfg || {})
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch email config" }, { status: 500 })
    }
}
