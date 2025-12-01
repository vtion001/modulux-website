import { NextResponse } from "next/server"
import path from "path"
import { mkdir, readFile, writeFile } from "fs/promises"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = `proposal_${Date.now()}`
    let pricingSnapshot: any = null
    let calculatorSnapshot: any = body?.calculatorSnapshot || null
    let pricingSnapshotTs: string | null = null
    let versionTs = Date.now()
    try {
      const supabase = supabaseServer()
      if (body?.pricingSnapshot) {
        pricingSnapshot = body.pricingSnapshot
        pricingSnapshotTs = new Date().toISOString()
        versionTs = Date.now()
        const versionData = pricingSnapshot ? { ...pricingSnapshot, prefill: calculatorSnapshot || null } : { prefill: calculatorSnapshot || null }
        await supabase.from("calculator_pricing_versions").insert({ ts: versionTs, data: versionData })
      } else {
        const { data: currentPricing } = await supabase.from("calculator_pricing").select("data,updated_at").eq("id", "current").single()
        pricingSnapshot = currentPricing?.data || null
        pricingSnapshotTs = currentPricing?.updated_at || null
        if (!pricingSnapshot) {
          try {
            const filePath = path.join(process.cwd(), "data", "calculator-pricing.json")
            const txt = await readFile(filePath, "utf-8")
            pricingSnapshot = JSON.parse(txt)
            pricingSnapshotTs = new Date().toISOString()
          } catch {}
        }
        versionTs = Date.now()
        const versionData = pricingSnapshot ? { ...pricingSnapshot, prefill: calculatorSnapshot || null } : { prefill: calculatorSnapshot || null }
        await supabase.from("calculator_pricing_versions").insert({ ts: versionTs, data: versionData })
      }
    } catch {}

    try {
      const dir = path.join(process.cwd(), "data")
      const versionsPath = path.join(dir, "calculator-pricing.versions.json")
      await mkdir(dir, { recursive: true })
      const raw = await readFile(versionsPath, "utf-8").catch(() => "[]")
      const arr = JSON.parse(raw || "[]")
      arr.unshift({ ts: Date.now(), data: (pricingSnapshot ? { ...pricingSnapshot, prefill: calculatorSnapshot || null } : { prefill: calculatorSnapshot || null }) })
      await writeFile(versionsPath, JSON.stringify(arr, null, 2))
    } catch {}
    const data = {
      id,
      client: body?.client || { name: "", email: "", company: "" },
      title: String(body?.title || "Proposal"),
      items: Array.isArray(body?.items) ? body.items : [],
      taxRate: Number(body?.taxRate || 0),
      discount: Number(body?.discount || 0),
      notes: String(body?.notes || ""),
      created_at: Date.now(),
      pricingSnapshot,
      pricingSnapshotTs,
      calculatorSnapshot,
    }
    const dir = path.join(process.cwd(), "data")
    const filePath = path.join(dir, "proposals.json")
    await mkdir(dir, { recursive: true })
    const raw = await readFile(filePath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(raw || "[]")
    arr.unshift(data)
    await writeFile(filePath, JSON.stringify(arr, null, 2))
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
