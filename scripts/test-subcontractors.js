import assert from "node:assert"
import { readFile, writeFile } from "fs/promises"
import path from "path"

const filePath = path.join(process.cwd(), "data", "subcontractors.json")

async function run() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  const id = `sub_${Date.now()}`
  list.push({ id, name: "Test Subcontractor", rates: { board_cut: 10, edge_band: 5, assembly: 20, install: 30 }, history: [] })
  await writeFile(filePath, JSON.stringify(list, null, 2))
  const nextRaw = await readFile(filePath, "utf-8")
  const next = JSON.parse(nextRaw || "[]")
  const found = next.find((f) => f.id === id)
  assert.ok(found, "Subcontractor should be persisted")
  assert.strictEqual(found.rates.board_cut, 10)
  console.log("✓ subcontractor CRUD persistence")
}

run().catch((e) => { console.error(e); process.exitCode = 1 })

