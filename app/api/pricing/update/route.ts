import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { NextResponse } from "next/server"

const filePath = path.join(process.cwd(), "data", "calculator-pricing.json")
const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const next = {
      baseRates: body.baseRates || { base: 0, hanging: 0, tall: 0 },
      tierMultipliers: body.tierMultipliers || { luxury: 1, premium: 1, standard: 1 },
      sheetRates: body.sheetRates || {
        base: { withoutFees: 0, withFees: 0 },
        hanging: { withoutFees: 0, withFees: 0 },
        tall: { withoutFees: 0, withFees: 0 },
      },
      cabinetTypeMultipliers: body.cabinetTypeMultipliers || { luxury: 1, premium: 0.9, basic: 0.8 },
    }
    await mkdir(path.join(process.cwd(), "data"), { recursive: true })
    await writeFile(filePath, JSON.stringify(next, null, 2))
    const existing = await readFile(versionsPath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(existing || "[]")
    arr.push({ ts: Date.now(), data: next })
    await writeFile(versionsPath, JSON.stringify(arr, null, 2))
    return NextResponse.json({ ok: true, data: next })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
  }
}
