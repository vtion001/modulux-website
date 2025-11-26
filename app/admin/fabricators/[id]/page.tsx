import path from "path"
import { readFile, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"

const filePath = path.join(process.cwd(), "data", "fabricators.json")

async function saveFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const install = Number(formData.get("install") || 0)
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  const idx = list.findIndex((f: any) => f.id === id)
  if (idx === -1) return
  const prev = list[idx]
  list[idx] = { id, name, rates: { board_cut, edge_band, assembly, install }, history: Array.isArray(prev.history) ? [...prev.history, { ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] : [{ ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] }
  await writeFile(filePath, JSON.stringify(list, null, 2))
  revalidatePath(`/admin/fabricators/${id}`)
  revalidatePath(`/admin/fabricators`)
}

export default async function AdminFabricatorEditPage({ params }: { params: { id: string } }) {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  const item = list.find((f: any) => f.id === params.id)
  if (!item) return <div className="text-muted-foreground">Fabricator not found</div>
  const r = item.rates || {}
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Fabricator</h1>
        <a className="text-sm text-primary" href="/admin/fabricators">Back</a>
      </div>
      <form action={saveFabricator} className="space-y-4">
        <input type="hidden" name="id" defaultValue={item.id} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Name</label>
          <input name="name" defaultValue={item.name} className="w-full p-2 border rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Board cutting</label>
            <input name="board_cut" defaultValue={r.board_cut || 0} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Edge banding</label>
            <input name="edge_band" defaultValue={r.edge_band || 0} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Assembly</label>
            <input name="assembly" defaultValue={r.assembly || 0} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Installation</label>
            <input name="install" defaultValue={r.install || 0} className="w-full p-2 border rounded" />
          </div>
        </div>
        <button className="px-3 py-2 rounded-md border">Save</button>
      </form>
      <div>
        <div className="text-sm font-medium">History</div>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {Array.isArray(item.history) && item.history.map((h: any, i: number) => (
            <div key={i} className="text-xs text-muted-foreground border rounded px-2 py-1">{new Date(h.ts).toLocaleString()} • {JSON.stringify(h.rates)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

