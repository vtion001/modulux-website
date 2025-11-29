import { revalidatePath } from "next/cache"
import { Pencil, Trash2, Search, Plus, Sparkles } from "lucide-react"
import { SelectOnFocusInput } from "@/components/select-on-focus"
import Link from "next/link"
import { AddModal } from "@/components/admin/add-modal"
import { SaveForm } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"

const defaults = [
  { id: "kitchen-cabinets", name: "Kitchen Cabinets", category: "Kitchen", image: "/modern-luxury-kitchen-with-emerald-green-modular-c.png" },
  { id: "wardrobes", name: "Wardrobes", category: "Wardrobes", image: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png" },
  { id: "bathroom-vanities", name: "Bathroom Vanities", category: "Bathroom", image: "/luxury-kitchen-with-emerald-green-modular-cabinets.png" },
  { id: "walk-in-closets", name: "Walk-in Closets", category: "Closets", image: "/luxury-home-office-with-emerald-green-modular-cabi.png" },
  { id: "bespoke-furniture", name: "Bespoke Furniture", category: "Furniture", image: "/elegant-living-room-with-built-in-emerald-green-mo.png" },
]

async function seedDefaults() {
  "use server"
  const supabase = supabaseServer()
  const { data } = await supabase.from("products").select("id")
  const set = new Set((data || []).map((x: any) => x.id))
  const missing = defaults.filter((d) => !set.has(d.id))
  if (missing.length) await supabase.from("products").upsert(missing, { onConflict: "id" })
  revalidatePath("/admin/products")
  revalidatePath("/products")
}

async function addProduct(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const category = String(formData.get("category") || "").trim()
  const image = String(formData.get("image") || "").trim()
  if (!id || !name) return
  const supabase = supabaseServer()
  await supabase.from("products").upsert({ id, name, category, image }, { onConflict: "id" })
  revalidatePath("/admin/products")
  revalidatePath("/products")
}

async function deleteProduct(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const supabase = supabaseServer()
  await supabase.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
  revalidatePath("/products")
}

export default async function AdminProductsPage() {
  const supabase = supabaseServer()
  const { data: itemsRaw } = await supabase.from("products").select("*").order("name")
  const items = itemsRaw || []
  return (
    <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground">Manage product entries displayed on the site</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AddModal trigger={<><Plus className="w-4 h-4" /> Add New</>} title="Add Product" description="Create a new product">
              <SaveForm action={addProduct} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SelectOnFocusInput name="id" placeholder="id" className="w-full p-2 border border-border/40 rounded" />
                  <SelectOnFocusInput name="name" placeholder="name" className="w-full p-2 border border-border/40 rounded" />
                </div>
                <SelectOnFocusInput name="category" placeholder="category" className="w-full p-2 border border-border/40 rounded" />
                <SelectOnFocusInput name="image" placeholder="image url" className="w-full p-2 border border-border/40 rounded" />
                <button className="w-full bg-primary text-white py-2 rounded transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Add</button>
              </SaveForm>
            </AddModal>
            <SaveForm action={seedDefaults}>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                <Sparkles className="w-4 h-4" />
                Seed Defaults
              </button>
            </SaveForm>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name or category"
              className="w-full pl-10 pr-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center">
                <img src={p.image || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-4">
                <div className="font-semibold text-foreground mb-1">{p.name}</div>
                <div className="text-sm text-muted-foreground mb-4">{p.category || "—"}</div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/products/${p.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <SaveForm action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </SaveForm>
                </div>
              </div>
            </div>
          ))}
        </div>
      
    </div>
  )
}
