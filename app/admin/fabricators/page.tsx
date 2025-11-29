import { revalidatePath } from "next/cache"
import { SaveForm } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"

const filePath = ""

async function addFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const board_cut = Number(formData.get("board_cut") || 0)
  const edge_band = Number(formData.get("edge_band") || 0)
  const assembly = Number(formData.get("assembly") || 0)
  const install = Number(formData.get("install") || 0)
  if (!id || !name) return
  const supabase = supabaseServer()
  const item = { id, name, rates: { board_cut, edge_band, assembly, install }, history: [{ ts: Date.now(), rates: { board_cut, edge_band, assembly, install } }] }
  await supabase.from("fabricators").upsert(item, { onConflict: "id" })
  revalidatePath("/admin/fabricators")
}

async function deleteFabricator(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const supabase = supabaseServer()
  await supabase.from("fabricators").delete().eq("id", id)
  revalidatePath("/admin/fabricators")
}

export default async function AdminFabricatorsPage() {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase.from("fabricators").select("*").order("name")
  const list = listRaw || []
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fabricators</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Manage third-party fabricator cost profiles and rates</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 text-sm">Total: {list.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Add Fabricator</h2>
            <SaveForm action={addFabricator} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-id">ID</label>
                <input id="fab-id" name="id" placeholder="fab_123" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-name">Name</label>
                <input id="fab-name" name="name" placeholder="Acme Fabrication" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-board">Board cutting</label>
                <input id="fab-board" name="board_cut" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-edge">Edge banding</label>
                <input id="fab-edge" name="edge_band" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-assembly">Assembly</label>
                <input id="fab-assembly" name="assembly" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="md:col-span-5">
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="fab-install">Installation</label>
                <input id="fab-install" name="install" type="number" min="0" step="0.01" placeholder="0" className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="md:col-span-5">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]" aria-label="Add fabricator">
                  Add
                </button>
              </div>
            </SaveForm>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Fabricators</h2>
            <div className="grid grid-cols-1 gap-3">
              {list.map((f) => (
                <div key={f.id} className="rounded-xl border border-border/40 p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-foreground">{f.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Board cut: {f?.rates?.board_cut || 0}</div>
                    <div>Edge band: {f?.rates?.edge_band || 0}</div>
                    <div>Assembly: {f?.rates?.assembly || 0}</div>
                    <div>Install: {f?.rates?.install || 0}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" href={`/admin/fabricators/${f.id}`} aria-label={`Edit ${f.name}`}>
                      Edit
                    </a>
                    <SaveForm action={deleteFabricator}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]" aria-label={`Delete ${f.name}`}>
                        Delete
                      </button>
                    </SaveForm>
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <div className="text-sm text-muted-foreground">No fabricators yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Guidelines</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Use unique IDs to prevent conflicts.</li>
              <li>All rates should be per job or per meter basis.</li>
              <li>Update history is stored automatically for audit.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
