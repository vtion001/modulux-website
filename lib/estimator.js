/**
 * Cabinet Estimator Logic (Pure JS)
 *
 * API:
 *   estimateCabinetCost(input: EstimatorInput): EstimatorResult
 *
 * EstimatorInput:
 *   - projectType: "kitchen" | "bathroom" | "bedroom" | "office"
 *   - cabinetType: "basic" | "premium" | "luxury"
 *   - linearMeter: number (> 0)
 *   - installation?: boolean (default: false)
 *   - kitchenScope?: "base_only" | "hanging_only" | ""
 *   - material?: "melamine" | "laminate" | "wood" | "premium" | ""
 *   - finish?: "standard" | "painted" | "stained" | "lacquer" | ""
 *   - hardware?: "basic" | "soft_close" | "premium" | ""
 *
 * EstimatorResult:
 *   - total: number
 *   - breakdown: {
 *       baseRate: number,
 *       linearMeter: number,
 *       tierAdjustment: { type: string, factor: number },
 *       installationAdd: number
 *     }
 *   - warnings: string[]
 *
 * Notes:
 *   This mirrors the EstimatorCalculator logic exactly for cost: luxury base rate per linear meter,
 *   then tier discount (premium 10%, basic 20%), plus installation add. Material/finish/hardware are validated
 *   but do not affect cost to preserve accuracy parity with the reference.
 */

export const allowed = {
  projectType: ["kitchen", "bathroom", "bedroom", "office"],
  cabinetType: ["basic", "premium", "luxury"],
  kitchenScope: ["", "base_only", "hanging_only"],
  material: ["", "melamine", "laminate", "wood", "premium"],
  finish: ["", "standard", "painted", "stained", "lacquer"],
  hardware: ["", "basic", "soft_close", "premium"],
}

export const pricing = {
  projectType: { kitchen: 1.0, bathroom: 0.8, bedroom: 0.9, office: 0.7 },
  roomSize: { small: 50000, medium: 100000, large: 200000, xlarge: 350000 },
  cabinetType: { basic: 1.0, premium: 1.5, luxury: 2.0 },
  material: { melamine: 1.0, laminate: 1.2, wood: 1.8, premium: 2.5 },
  finish: { standard: 1.0, painted: 1.3, stained: 1.4, lacquer: 1.6 },
  hardware: { basic: 1.0, soft_close: 1.2, premium: 1.5 },
  installation: 0.3,
}

export function estimateCabinetCost(input) {
  const warnings = []

  // Validate required fields
  const projectType = String(input.projectType || "").trim()
  const cabinetType = String(input.cabinetType || "").trim()
  const linearMeter = input.linearMeter != null ? Number(input.linearMeter) : NaN

  if (!allowed.projectType.includes(projectType)) {
    throw new Error("Invalid projectType")
  }
  if (!allowed.cabinetType.includes(cabinetType)) {
    throw new Error("Invalid cabinetType")
  }
  const hasLegacyLM = Number.isFinite(linearMeter) && linearMeter > 0
  if (!hasLegacyLM && !(Array.isArray(input.units) && input.units.length > 0)) {
    throw new Error("Invalid linearMeter or units")
  }

  // Validate optional params
  const kitchenScope = String(input.kitchenScope || "")
  const cabinetCategory = String(input.cabinetCategory || "base")
  const tier = String(input.tier || "")
  const material = String(input.material || "")
  const finish = String(input.finish || "")
  const hardware = String(input.hardware || "")
  const installation = Boolean(input.installation || false)

  if (!allowed.kitchenScope.includes(kitchenScope)) warnings.push("Unknown kitchenScope; ignored")
  if (!allowed.material.includes(material)) warnings.push("Unknown material; ignored")
  if (!allowed.finish.includes(finish)) warnings.push("Unknown finish; ignored")
  if (!allowed.hardware.includes(hardware)) warnings.push("Unknown hardware; ignored")

  // Core calculation (parity with EstimatorCalculator)
  const baseRates = input.baseRates || null
  const tierMultipliers = input.tierMultipliers || null
  const cabinetTypeMultipliers = input.cabinetTypeMultipliers || null
  const DEFAULT_SHEET_RATES = {
    base: { withoutFees: 40476.4, withFees: 51097.4 },
    hanging: { withoutFees: 38452.58, withFees: 48542.53 },
    tall: { withoutFees: 65182.2, withFees: 82286.1 },
  }
  const sheetRates = input.sheetRates || DEFAULT_SHEET_RATES
  const includeFees = Boolean(input.includeFees || false)
  const importSurcharge = Boolean(input.applyImportSurcharge || false)
  const downgradeToMFC = Boolean(input.downgradeToMFC || false)

  const materialFactor = (m) => (m && pricing.material[m] ? Number(pricing.material[m]) : 1)
  const finishFactor = (f) => (f && pricing.finish[f] ? Number(pricing.finish[f]) : 1)
  const hardwareFactor = (h) => (h && pricing.hardware[h] ? Number(pricing.hardware[h]) : 1)
  const tierFactorFor = (t) => {
    if (tierMultipliers && t && tierMultipliers[t] != null) return Number(tierMultipliers[t]) || 1
    if (cabinetTypeMultipliers && cabinetType && cabinetTypeMultipliers[cabinetType] != null) return Number(cabinetTypeMultipliers[cabinetType]) || 1
    if (cabinetType === "premium") return 0.9
    if (cabinetType === "basic") return 0.8
    return 1
  }

  let subtotal = 0
  const unitBreakdown = []

  const resolveBaseRate = (category) => {
    const pair = sheetRates && sheetRates[category]
    if (pair) {
      const r = includeFees ? Number(pair.withFees) : Number(pair.withoutFees)
      if (Number.isFinite(r) && r > 0) return r
    }
    if (baseRates && baseRates[category]) return Number(baseRates[category])
    const fallbackPair = DEFAULT_SHEET_RATES[category]
    const fr = includeFees ? Number(fallbackPair.withFees) : Number(fallbackPair.withoutFees)
    return Number(fr)
  }

  if (hasLegacyLM) {
    const baseRate = resolveBaseRate(cabinetCategory)
    const tf = tierFactorFor(tier)
    const matF = materialFactor(material)
    const finF = finishFactor(finish)
    const hwF = hardwareFactor(hardware)
    let line = baseRate * linearMeter * tf * matF * finF * hwF
    let installAdd = 0
    if (installation) installAdd = baseRate * pricing.installation * linearMeter
    line += installAdd
    if (importSurcharge) line *= 1.1
    if (downgradeToMFC) line *= 0.9
    subtotal += line
    unitBreakdown.push({ category: cabinetCategory, meters: linearMeter, baseRate, tierFactor: tf, materialFactor: matF, finishFactor: finF, hardwareFactor: hwF, installationAdd: installAdd, lineTotal: line })
  }

  if (Array.isArray(input.units)) {
    for (const u of input.units) {
      const meters = Number(u.meters || 0)
      if (!Number.isFinite(meters) || meters <= 0) { warnings.push(`Unit ${u.category || "unknown"} has invalid meters; skipped`) ; continue }
      const category = String(u.category || "base")
      const baseRate = resolveBaseRate(category)
      const tf = tierFactorFor(u.tier || tier)
      const matF = materialFactor(u.material || material)
      const finF = finishFactor(u.finish || finish)
      const hwF = hardwareFactor(u.hardware || hardware)
      let line = baseRate * meters * tf * matF * finF * hwF
      let installAdd = 0
      if (installation || u.installation) installAdd = baseRate * pricing.installation * meters
      line += installAdd
      if (importSurcharge) line *= 1.1
      if (downgradeToMFC) line *= 0.9
      subtotal += line
      unitBreakdown.push({ category, meters, baseRate, tierFactor: tf, materialFactor: matF, finishFactor: finF, hardwareFactor: hwF, installationAdd: installAdd, lineTotal: line })
    }
  }

  const discountRate = Number(input.discount || 0) // 0..1
  const taxed = Boolean(input.applyTax || false)
  const taxRate = Number(input.taxRate || 0)
  const discounted = subtotal * (1 - (discountRate > 0 && discountRate < 1 ? discountRate : 0))
  const tax = taxed && taxRate > 0 ? discounted * taxRate : 0
  const total = Math.round(discounted + tax)

  return {
    total,
    breakdown: {
      units: unitBreakdown,
      subtotal: Math.round(subtotal),
      discountRate: discountRate > 0 && discountRate < 1 ? discountRate : 0,
      taxRate: taxed ? taxRate : 0,
      tax: Math.round(tax),
    },
    warnings,
  }
}
