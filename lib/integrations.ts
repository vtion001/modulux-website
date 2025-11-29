import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"

const integrationsPath = path.join(process.cwd(), "data", "integrations.json")

export async function readIntegrations(): Promise<any> {
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const raw = await readFile(integrationsPath, "utf-8").catch(() => "{}")
  try { return JSON.parse(raw || "{}") } catch { return {} }
}

export async function writeIntegration(provider: string, data: any) {
  const db = await readIntegrations()
  db[provider] = { ...(db[provider]||{}), ...data }
  await writeFile(integrationsPath, JSON.stringify(db, null, 2))
}
