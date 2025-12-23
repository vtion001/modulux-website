import { supabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = supabaseServer()

    try {
        const [
            { data: events },
            { data: inquiries },
            { data: rfqs },
            { data: leads },
            { data: deals },
            { data: projects },
            { data: blog_posts },
            { data: products }
        ] = await Promise.all([
            supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("subcontractor_rfqs").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("deals").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("blog_posts").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("products").select("*").order("created_at", { ascending: false }).limit(5),
        ])

        const activity = [
            ...(events || []).map((e: any) => ({
                id: e.id,
                type: "event",
                title: `Event: ${e.name}`,
                description: JSON.stringify(e.props_json),
                timestamp: e.created_at,
            })),
            ...(inquiries || []).map((i: any) => ({
                id: i.id,
                type: "inquiry",
                title: `New Inquiry: ${i.name}`,
                description: i.message,
                timestamp: i.created_at,
            })),
            ...(rfqs || []).map((r: any) => ({
                id: r.id,
                type: "rfq",
                title: `RFQ Sent: ${r.name || r.subcontractor_id || r.fabricator_id}`,
                description: r.subject,
                timestamp: r.created_at,
            })),
            ...(leads || []).map((l: any) => ({
                id: l.id,
                type: "lead",
                title: `New Lead: ${l.name}`,
                description: `Source: ${l.source}`,
                timestamp: l.created_at,
            })),
            ...(deals || []).map((d: any) => ({
                id: d.id,
                type: "deal",
                title: `New Deal: ${d.title}`,
                description: `Value: ₱${Number(d.value || 0).toLocaleString()}`,
                timestamp: d.created_at,
            })),
            ...(projects || []).map((p: any) => ({
                id: p.id,
                type: "project",
                title: `New Project: ${p.title}`,
                description: p.location || "Added to projects",
                timestamp: p.created_at,
            })),
            ...(blog_posts || []).map((b: any) => ({
                id: b.id,
                type: "blog",
                title: `New Blog Post: ${b.title}`,
                description: b.excerpt || "New post published",
                timestamp: b.created_at,
            })),
            ...(products || []).map((p: any) => ({
                id: p.id,
                type: "product",
                title: `New Product: ${p.name}`,
                description: p.category || "New product added",
                timestamp: p.created_at,
            })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20)

        return NextResponse.json({ ok: true, activity })
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}
