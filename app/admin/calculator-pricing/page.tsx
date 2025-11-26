import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { AdminCalculatorEmbed } from "@/components/admin/admin-calculator-embed"

const filePath = path.join(process.cwd(), "data", "calculator-pricing.json")
const versionsPath = path.join(process.cwd(), "data", "calculator-pricing.versions.json")

async function savePricing(formData: FormData) {
  "use server"
  const base_base = Number(formData.get("base_base") || 0)
  const base_hanging = Number(formData.get("base_hanging") || 0)
  const base_tall = Number(formData.get("base_tall") || 0)
  const tier_luxury = Number(formData.get("tier_luxury") || 1)
  const tier_premium = Number(formData.get("tier_premium") || 1)
  const tier_standard = Number(formData.get("tier_standard") || 1)
  const sheet_base_without = Number(formData.get("sheet_base_without") || 0)
  const sheet_base_with = Number(formData.get("sheet_base_with") || 0)
  const sheet_hanging_without = Number(formData.get("sheet_hanging_without") || 0)
  const sheet_hanging_with = Number(formData.get("sheet_hanging_with") || 0)
  const sheet_tall_without = Number(formData.get("sheet_tall_without") || 0)
  const sheet_tall_with = Number(formData.get("sheet_tall_with") || 0)
  const ct_luxury = Number(formData.get("ct_luxury") || 1)
  const ct_premium = Number(formData.get("ct_premium") || 0.9)
  const ct_basic = Number(formData.get("ct_basic") || 0.8)
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const next = {
    baseRates: { base: base_base || 0, hanging: base_hanging || 0, tall: base_tall || 0 },
    tierMultipliers: { luxury: tier_luxury || 1, premium: tier_premium || 1, standard: tier_standard || 1 },
    sheetRates: {
      base: { withoutFees: sheet_base_without || 0, withFees: sheet_base_with || 0 },
      hanging: { withoutFees: sheet_hanging_without || 0, withFees: sheet_hanging_with || 0 },
      tall: { withoutFees: sheet_tall_without || 0, withFees: sheet_tall_with || 0 },
    },
    cabinetTypeMultipliers: { luxury: ct_luxury || 1, premium: ct_premium || 0.9, basic: ct_basic || 0.8 },
  }
  await writeFile(filePath, JSON.stringify(next, null, 2))
  try {
    const existing = await readFile(versionsPath, "utf-8").catch(() => "[]")
    const arr = JSON.parse(existing || "[]")
    arr.push({ ts: Date.now(), data: next })
    await writeFile(versionsPath, JSON.stringify(arr, null, 2))
  } catch {}
  revalidatePath("/calculator")
  revalidatePath("/admin/calculator-pricing")
}

async function importPricing(formData: FormData) {
  "use server"
  const file = formData.get("import_file") as File | null
  if (!file) return
  const buf = Buffer.from(await file.arrayBuffer())
  const parsed = JSON.parse(buf.toString())
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  await writeFile(filePath, JSON.stringify(parsed, null, 2))
  const existing = await readFile(versionsPath, "utf-8").catch(() => "[]")
  const arr = JSON.parse(existing || "[]")
  arr.push({ ts: Date.now(), data: parsed })
  await writeFile(versionsPath, JSON.stringify(arr, null, 2))
  revalidatePath("/calculator")
  revalidatePath("/admin/calculator-pricing")
}

  return (
    <div className="max-w-6xl mx-auto">
      <AdminCalculatorEmbed />
    </div>
  )
}
