import assert from "node:assert"
import { estimateCabinetCost } from "../lib/estimator.js"

function t(name, fn) {
  try { fn(); console.log(`✓ ${name}`) } catch (e) { console.error(`✗ ${name}`); console.error(e); process.exitCode = 1 }
}

t("luxury no install", () => {
  const res = estimateCabinetCost({ projectType: "kitchen", cabinetType: "luxury", linearMeter: 10 })
  assert.strictEqual(res.total, Math.round(2.0 * 10))
})

t("premium 10% discount", () => {
  const res = estimateCabinetCost({ projectType: "kitchen", cabinetType: "premium", linearMeter: 10 })
  assert.strictEqual(res.total, Math.round(2.0 * 10 * 0.9))
})

t("basic 20% discount", () => {
  const res = estimateCabinetCost({ projectType: "kitchen", cabinetType: "basic", linearMeter: 10 })
  assert.strictEqual(res.total, Math.round(2.0 * 10 * 0.8))
})

t("installation add", () => {
  const res = estimateCabinetCost({ projectType: "kitchen", cabinetType: "luxury", linearMeter: 10, installation: true })
  const expected = 2.0 * 10 + 2.0 * 0.3 * 10
  assert.strictEqual(res.total, Math.round(expected))
})

t("validation invalid projectType", () => {
  assert.throws(() => estimateCabinetCost({ projectType: "invalid", cabinetType: "luxury", linearMeter: 5 }), /Invalid projectType/)
})

t("validation invalid cabinetType", () => {
  assert.throws(() => estimateCabinetCost({ projectType: "kitchen", cabinetType: "gold", linearMeter: 5 }), /Invalid cabinetType/)
})

t("validation invalid linearMeter", () => {
  assert.throws(() => estimateCabinetCost({ projectType: "kitchen", cabinetType: "luxury", linearMeter: 0 }), /Invalid linearMeter/)
})

