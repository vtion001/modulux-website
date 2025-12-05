import { revalidatePath } from "next/cache"
import { SaveForm } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"


async function saveFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const install = Number(formData.get("install") || 0)
  const supabase = supabaseServer()
  const { data: prev } = await supabase.from("fabricators").select("*").eq("id", id).single()
  if (!prev) return
  const history = Array.isArray(prev.history) ? [...prev.history, { ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] : [{ ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }]
  await supabase.from("fabricators").update({ name, email, rates: { board_cut, edge_band, assembly, install }, history }).eq("id", id)
  revalidatePath(`/admin/fabricators/${id}`)
  revalidatePath(`/admin/fabricators`)
}

export default async function AdminFabricatorEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: item } = await supabase.from("fabricators").select("*").eq("id", params.id).single()
  if (!item) return <div className="text-muted-foreground">Fabricator not found</div>
  const r = item.rates || {}
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Fabricator</h1>
        <a className="text-sm text-primary" href="/admin/fabricators">Back</a>
      </div>
      <SaveForm action={saveFabricator} className="space-y-4">
        <input type="hidden" name="id" defaultValue={item.id} />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Name</label>
          <input name="name" defaultValue={item.name} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Email</label>
          <input name="email" type="email" defaultValue={item.email || ""} className="w-full p-2 border rounded" />
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
      </SaveForm>
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
