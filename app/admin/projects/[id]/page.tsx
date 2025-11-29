import path from "path"
import { writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { BlogAiTools } from "@/components/admin/blog-ai-tools"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import Link from "next/link"
import { ToastOnParam } from "@/components/admin/toast-on-param"
import { supabaseServer } from "@/lib/supabase-server"

const uploadsDir = path.join(process.cwd(), "public", "uploads")

async function updateProject(prevState: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const title = String(formData.get("title") || "").trim()
  const location = String(formData.get("location") || "").trim()
  const year = String(formData.get("year") || "").trim()
  const type = String(formData.get("type") || "").trim()
  const description = String(formData.get("description") || "").trim()
  let image = String(formData.get("image") || "").trim()
  const images = formData
    .getAll("images")
    .map((v) => String(v || "").trim())
    .filter(Boolean) as string[]
  const services = String(formData.get("services") || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (!id || !title) return
  const supabase = supabaseServer()
  const { data: curr } = await supabase.from("projects").select("*").eq("id", id).single()
  if (!curr) return
  const file = formData.get("imageFile") as File | null
  if (file && typeof file === "object" && file.size > 0) {
    await mkdir(uploadsDir, { recursive: true })
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : ""
    const name = `${id}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(dest, buffer)
    image = `/uploads/${name}`
    images.unshift(image)
  }
  if (!image && images.length) image = images[0]
  await supabase.from("projects").update({ title, location, year, type, description, image, images, services }).eq("id", id)
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
  return { ok: true, message: "Project changes saved" }
}

export default async function AdminProjectEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single()
  return (
    <div className="max-w-3xl">
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <Link href="/admin/projects" className="text-sm text-primary">Back to Projects</Link>
      </div>
      
      {project ? (
        <SaveForm action={updateProject}>
          <input type="hidden" name="id" defaultValue={project.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <SelectOnFocusInput name="title" defaultValue={project.title} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Year</label>
              <SelectOnFocusInput name="year" defaultValue={project.year} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Location</label>
              <SelectOnFocusInput name="location" defaultValue={project.location} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Type</label>
              <SelectOnFocusInput name="type" defaultValue={project.type} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
              <SelectOnFocusInput name="image" defaultValue={project.image} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Upload Image</label>
              <input type="file" name="imageFile" accept="image/*" className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Additional Images (URLs)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectOnFocusInput name="images" defaultValue={Array.isArray(project.images) ? project.images[0] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
              <SelectOnFocusInput name="images" defaultValue={Array.isArray(project.images) ? project.images[1] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
              <SelectOnFocusInput name="images" defaultValue={Array.isArray(project.images) ? project.images[2] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
              <SelectOnFocusInput name="images" defaultValue={Array.isArray(project.images) ? project.images[3] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <SelectOnFocusTextarea name="description" defaultValue={project.description} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <BlogAiTools descriptionName="description" imageName="image" />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Services</label>
            <SelectOnFocusInput name="services" defaultValue={Array.isArray(project.services) ? project.services.join(", ") : ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <SubmitButton>Save Changes</SubmitButton>
        </SaveForm>
      ) : (
        <div className="text-muted-foreground">Project not found</div>
      )}
    </div>
  )
}
