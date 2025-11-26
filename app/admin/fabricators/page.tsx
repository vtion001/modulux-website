import path from "path"
import { readFile, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"

const filePath = path.join(process.cwd(), "data", "fabricators.json")

async function addFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const install = Number(formData.get("install") || 0)
  if (!id || !name) return
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  if (list.find((f: any) => f.id === id)) return
  const item = { id, name, rates: { board_cut, edge_band, assembly, install }, history: [{ ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] }
  list.unshift(item)
  await writeFile(filePath, JSON.stringify(list, null, 2))
  revalidatePath("/admin/fabricators")
}

async function deleteFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  const next = list.filter((f: any) => f.id !== id)
  await writeFile(filePath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/fabricators")
}

export default async function AdminFabricatorsPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]") as any[]
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fabricators</h1>
        <p className="text-sm text-muted-foreground">Manage third-party fabricator cost profiles</p>
      </div>

      <form action={addFabricator} className="grid grid-cols-1 md:grid-cols-5 gap-3 border p-3 rounded-md">
        <input name="id" placeholder="ID" className="p-2 border rounded" />
        <input name="name" placeholder="Name" className="p-2 border rounded" />
        <input name="board_cut" placeholder="Board cutting" className="p-2 border rounded" />
        <input name="edge_band" placeholder="Edge banding" className="p-2 border rounded" />
        <input name="assembly" placeholder="Assembly" className="p-2 border rounded" />
        <input name="install" placeholder="Installation" className="p-2 border rounded md:col-span-5" />
        <button className="px-3 py-2 rounded-md border">Add</button>
      </form>

      <div className="grid grid-cols-1 gap-3">
        {list.map((f) => (
          <div key={f.id} className="border rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">ID: {f.id}</div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Board cut: {f?.rates?.board_cut || 0}</div>
              <div>Edge band: {f?.rates?.edge_band || 0}</div>
              <div>Assembly: {f?.rates?.assembly || 0}</div>
              <div>Install: {f?.rates?.install || 0}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <a className="px-3 py-2 rounded-md border text-sm" href={`/admin/fabricators/${f.id}`}>Edit</a>
              <form action={deleteFabricator}>
                <input type="hidden" name="id" value={f.id} />
                <button className="px-3 py-2 rounded-md border text-sm">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

