import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile, writeFile } from "fs/promises"

const JSON_PATH = path.join(process.cwd(), "data", "proposal-snippets.json")

async function getLocalSnippets() {
    try {
        const txt = await readFile(JSON_PATH, "utf-8")
        const data = JSON.parse(txt || "[]")
        // Ensure every snippet has an ID for frontend stability
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
        const supabase = supabaseServer()
        const { data, error } = await supabase.from("proposal_snippets").select("*").order("label")

        if (error) {
            console.warn("Supabase GET error (falling back to JSON):", error.message)
            const local = await getLocalSnippets()
            return NextResponse.json({ snippets: local })
        }
        return NextResponse.json({ snippets: data || [] })
    } catch (e: any) {
        console.warn("Snippet GET fallback triggered:", e.message)
        const local = await getLocalSnippets()
        return NextResponse.json({ snippets: local })
    }
}

export async function POST(request: Request) {
    let body: any
    try {
        body = await request.json()
    } catch (e) {
        return NextResponse.json({ error: "Missing or invalid JSON body" }, { status: 400 })
    }

    try {
        const supabase = supabaseServer()
        const { data, error } = await supabase.from("proposal_snippets").upsert({
            id: body.id || undefined,
            label: body.label,
            content: body.content,
            updated_at: new Date().toISOString()
        }).select().single()

        if (error) {
            console.warn("Supabase POST error (falling back to JSON):", error.message)
            const local = await getLocalSnippets()
            if (body.id) {
                const idx = local.findIndex((s: any) => s.id === body.id)
                if (idx > -1) local[idx] = { ...local[idx], ...body }
                else local.push({ id: body.id, ...body })
            } else {
                local.push({ id: `local_${Date.now()}`, ...body })
            }
            await saveLocalSnippets(local)
            return NextResponse.json({ ok: true, snippet: body })
        }
        return NextResponse.json({ ok: true, snippet: data })
    } catch (e: any) {
        console.warn("Snippet POST fallback triggered:", (e as Error).message)
        try {
            const local = await getLocalSnippets()
            if (body) {
                const idx = local.findIndex((s: any) => (s.id && s.id === body.id))
                if (idx > -1) local[idx] = { ...local[idx], ...body }
                else local.push({ id: body.id || `local_${Date.now()}`, ...body })
                await saveLocalSnippets(local)
                return NextResponse.json({ ok: true, snippet: body })
            }
            throw e
        } catch (inner: any) {
            return NextResponse.json({ error: inner.message }, { status: 500 })
        }
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
        const supabase = supabaseServer()
        const { error } = await supabase.from("proposal_snippets").delete().eq("id", id)

        if (error) {
            console.warn("Supabase DELETE error (falling back to JSON):", error.message)
            let local = await getLocalSnippets()
            local = local.filter((s: any) => s.id !== id)
            await saveLocalSnippets(local)
            return NextResponse.json({ ok: true })
        }
        return NextResponse.json({ ok: true })
    } catch (e: any) {
        console.warn("Snippet DELETE fallback triggered:", (e as Error).message)
        try {
            let local = await getLocalSnippets()
            local = local.filter((s: any) => s.id !== id)
            await saveLocalSnippets(local)
            return NextResponse.json({ ok: true })
        } catch (inner: any) {
            return NextResponse.json({ error: inner.message }, { status: 500 })
        }
    }
}
