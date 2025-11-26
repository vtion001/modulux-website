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
  const linearMeter = Number(input.linearMeter)

  if (!allowed.projectType.includes(projectType)) {
    throw new Error("Invalid projectType")
  }
  if (!allowed.cabinetType.includes(cabinetType)) {
    throw new Error("Invalid cabinetType")
  }
  if (!Number.isFinite(linearMeter) || linearMeter <= 0) {
    throw new Error("Invalid linearMeter")
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
  const baseRate = baseRates && baseRates[cabinetCategory] ? Number(baseRates[cabinetCategory]) : pricing.cabinetType.luxury
  let total = baseRate * linearMeter

  let tierFactor = 1
  if (tierMultipliers && tier && tierMultipliers[tier]) tierFactor = Number(tierMultipliers[tier]) || 1
  else {
    if (cabinetType === "premium") tierFactor = 0.9
    else if (cabinetType === "basic") tierFactor = 0.8
  }
  total *= tierFactor

  let installAdd = 0
  if (installation) installAdd = baseRate * pricing.installation * linearMeter
  total += installAdd

  return {
    total: Math.round(total),
    breakdown: {
      baseRate,
      linearMeter,
      tierAdjustment: { type: cabinetType, factor: tierFactor },
      installationAdd: installAdd,
    },
    warnings,
  }
}
