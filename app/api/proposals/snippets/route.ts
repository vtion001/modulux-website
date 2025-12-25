import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const JSON_PATH = path.join(process.cwd(), "data", "proposal-snippets.json")

// Simple UUID v4 check
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

async function getLocalSnippets() {
    try {
        const txt = await readFile(JSON_PATH, "utf-8")
        const data = JSON.parse(txt || "[]")
        return data.map((s: any, idx: number) => ({
            id: s.id || `local_${idx}`,
            ...s
        }))
    } catch (e) {
        console.error("Error reading local snippets:", e)
        return []
    }
}

async function saveLocalSnippets(snippets: any[]) {
    try {
        await writeFile(JSON_PATH, JSON.stringify(snippets, null, 2))
        return true
    } catch (e) {
        console.error("Error saving local snippets:", e)
        return false
    }
}

export async function GET() {
    try {
        try {
            const supabase = supabaseServer()
            const { data, error } = await supabase.from("proposal_snippets").select("*").order("label")

            if (error) throw error
            return NextResponse.json({ snippets: data || [] })
        } catch (dbError: any) {
            console.warn("DB Snippets GET failed, using local fallback:", dbError.message || dbError)
            const local = await getLocalSnippets()
            return NextResponse.json({ snippets: local })
        }
    } catch (critical: any) {
        return NextResponse.json({ snippets: [] }, { status: 200 })
    }
}

export async function POST(request: Request) {
    let body: any
    try {
        body = await request.json()
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    try {
        try {
            const supabase = supabaseServer()
            const supabaseId = (body.id && isUUID(body.id)) ? body.id : undefined

            const { data, error } = await supabase.from("proposal_snippets").upsert({
                id: supabaseId,
                label: body.label,
                content: body.content,
                updated_at: new Date().toISOString()
            }).select().single()

            if (error) throw error
            return NextResponse.json({ ok: true, snippet: data })
        } catch (dbError: any) {
            console.warn("DB Snippets POST failed, using local fallback:", dbError.message || dbError)
            const local = await getLocalSnippets()
            if (body.id) {
                const idx = local.findIndex((s: any) => s.id === body.id)
                if (idx > -1) local[idx] = { ...local[idx], ...body }
                else local.push({ id: body.id, ...body })
            } else {
                const newId = `local_${Date.now()}`
                local.push({ ...body, id: newId })
                body.id = newId // Update body for return
            }
            await saveLocalSnippets(local)
            return NextResponse.json({ ok: true, snippet: body })
        }
    } catch (critical: any) {
        return NextResponse.json({ error: critical.message || "Unknown error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    let id: string
    try {
        const body = await request.json()
        id = body.id
    } catch (e) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    try {
        try {
            const supabase = supabaseServer()
            if (!isUUID(id)) throw new Error("Local ID - skip DB")

            const { error } = await supabase.from("proposal_snippets").delete().eq("id", id)
            if (error) throw error
            return NextResponse.json({ ok: true })
        } catch (dbError: any) {
            console.warn("DB Snippets DELETE failed/skipped, using local fallback:", dbError.message || dbError)
            let local = await getLocalSnippets()
            local = local.filter((s: any) => s.id !== id)
            await saveLocalSnippets(local)
            return NextResponse.json({ ok: true })
        }
    } catch (critical: any) {
        return NextResponse.json({ error: critical.message || "Unknown error" }, { status: 500 })
    }
}
