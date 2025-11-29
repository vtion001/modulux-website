import { revalidatePath } from "next/cache"
import Link from "next/link"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { supabaseServer } from "@/lib/supabase-server"

async function updateProduct(prevState: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const category = String(formData.get("category") || "").trim()
  const image = String(formData.get("image") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const features = String(formData.get("features") || "").split(",").map((s) => s.trim()).filter(Boolean)
  const gallery = formData.getAll("gallery").map((v) => String(v || "").trim()).filter(Boolean)
  const specs = {
    material: String(formData.get("material") || "").trim(),
    finish: String(formData.get("finish") || "").trim(),
    hardware: String(formData.get("hardware") || "").trim(),
    thickness: String(formData.get("thickness") || "").trim(),
    installation: String(formData.get("installation") || "").trim(),
    warranty: String(formData.get("warranty") || "").trim(),
  }
  if (!id || !name) return { ok: false }
  const supabase = supabaseServer()
  await supabase.from("products").update({ name, category, image, description, features, specs, gallery }).eq("id", id)
  revalidatePath("/admin/products")
  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
  return { ok: true, message: "Product updated" }
}

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data } = await supabase.from("products").select("*").eq("id", params.id).single()
  const product = data as any
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link href="/admin/products" className="text-sm text-primary">Back to Products</Link>
      </div>
      {product ? (
        <SaveForm action={updateProduct}>
          <input type="hidden" name="id" defaultValue={product.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name</label>
              <SelectOnFocusInput name="name" defaultValue={product.name} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <SelectOnFocusInput name="category" defaultValue={product.category || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
            <SelectOnFocusInput name="image" defaultValue={product.image || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <SelectOnFocusTextarea name="description" defaultValue={product.description || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Features (comma-separated)</label>
            <SelectOnFocusInput name="features" defaultValue={Array.isArray(product.features) ? product.features.join(", ") : ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Material</label>
              <SelectOnFocusInput name="material" defaultValue={product.specs?.material || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Finish</label>
              <SelectOnFocusInput name="finish" defaultValue={product.specs?.finish || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Hardware</label>
              <SelectOnFocusInput name="hardware" defaultValue={product.specs?.hardware || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Thickness</label>
              <SelectOnFocusInput name="thickness" defaultValue={product.specs?.thickness || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Installation</label>
              <SelectOnFocusInput name="installation" defaultValue={product.specs?.installation || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Warranty</label>
              <SelectOnFocusInput name="warranty" defaultValue={product.specs?.warranty || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Gallery Images (URLs)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(product.gallery) ? product.gallery : ["", "", ""]).slice(0, 4).map((g: string, i: number) => (
                <SelectOnFocusInput key={i} name="gallery" defaultValue={g || ""} className="w-full p-2 border border-border/40 rounded" />
              ))}
            </div>
          </div>
          <SubmitButton>Save Changes</SubmitButton>
        </SaveForm>
      ) : (
        <div className="text-muted-foreground">Product not found</div>
      )}
    </div>
  )
}
