import { NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const q = String(url.searchParams.get("q") || "").trim().toLowerCase()
        const sort = String(url.searchParams.get("sort") || "created_desc")
        const page = Math.max(1, Number(url.searchParams.get("page") || 1))
        const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") || 10))

        const dir = path.join(process.cwd(), "data")
        const filePath = path.join(dir, "proposals.json")

        let proposals: any[] = []
        try {
            const txt = await readFile(filePath, "utf-8")
            proposals = JSON.parse(txt || "[]")
        } catch {
            proposals = []
        }

        if (q) {
            proposals = proposals.filter((p: any) => {
                const title = String(p.title || "").toLowerCase()
                const clientName = String(p.client?.name || "").toLowerCase()
                const clientEmail = String(p.client?.email || "").toLowerCase()
                const clientCompany = String(p.client?.company || "").toLowerCase()
                return title.includes(q) || clientName.includes(q) || clientEmail.includes(q) || clientCompany.includes(q)
            })
        }

        // Sort
        proposals.sort((a, b) => {
            let valA: any, valB: any
            if (sort === "created_desc") {
                valA = a.created_at || 0
                valB = b.created_at || 0
                return valB - valA
            } else if (sort === "created_asc") {
                valA = a.created_at || 0
                valB = b.created_at || 0
                return valA - valB
            } else if (sort === "title_asc") {
                valA = String(a.title || "").toLowerCase()
                valB = String(b.title || "").toLowerCase()
                return valA.localeCompare(valB)
            } else if (sort === "client_asc") {
                valA = String(a.client?.name || "").toLowerCase()
                valB = String(b.client?.name || "").toLowerCase()
                return valA.localeCompare(valB)
            }
            return 0
        })

        const total = proposals.length
        const offset = (page - 1) * pageSize
        const paginated = proposals.slice(offset, offset + pageSize)

        return NextResponse.json({ proposals: paginated, total, page, pageSize })
    } catch (e) {
        return NextResponse.json({ error: "Failed to load sent proposals" }, { status: 500 })
    }
}
