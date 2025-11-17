import path from "path"
import { revalidatePath } from "next/cache"
import { readFile, writeFile, mkdir } from "fs/promises"
import { MapPin, Calendar, Plus, Search, Trash2, Pencil } from "lucide-react"
import Link from "next/link"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { BlogAiTools } from "@/components/admin/blog-ai-tools"
import { AddModal } from "@/components/admin/add-modal"

const filePath = path.join(process.cwd(), "data", "projects.json")

async function addProject(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const title = String(formData.get("title") || "").trim()
  const location = String(formData.get("location") || "").trim()
  const year = String(formData.get("year") || "").trim()
  const type = String(formData.get("type") || "").trim()
  const description = String(formData.get("description") || "").trim()
  let image = String(formData.get("image") || "").trim()
  const sanitize = (src: string) => {
    const s = (src || "").trim()
    if (!s) return ""
    const trimToFirstExt = (u: string) => {
      const re = /(\.jpe?g|\.png|\.webp|\.gif)/i
      const m = re.exec(u)
      if (!m) return u
      return u.slice(0, m.index + m[0].length)
    }
    if (s.startsWith("http")) return trimToFirstExt(s)
    if (s.startsWith("/")) {
      if (s.includes("http")) {
        const i = s.indexOf("http")
        return trimToFirstExt(s.slice(i))
      }
      return trimToFirstExt(s)
    }
    if (s.includes("http")) {
      const i = s.indexOf("http")
      return trimToFirstExt(s.slice(i))
    }
    return ""
  }
  let images = formData
    .getAll("images")
    .map((v) => sanitize(String(v || "")))
    .filter(Boolean) as string[]
  const services = String(formData.get("services") || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (!id || !title) return
  const raw = await readFile(filePath, "utf-8")
  const list = JSON.parse(raw)
  if (list.find((p: any) => p.id === id)) return
  const file = formData.get("imageFile") as File | null
  if (file && typeof file === "object" && file.size > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : ""
    const name = `${id}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(dest, buffer)
    image = `/uploads/${name}`
    images.unshift(image)
  }
  image = sanitize(image) || (images.length ? images[0] : "")
  list.unshift({ id, title, location, year, type, description, image, images, services })
  await writeFile(filePath, JSON.stringify(list, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

async function deleteProject(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const raw = await readFile(filePath, "utf-8")
  const list = JSON.parse(raw)
  const next = list.filter((p: any) => p.id !== id)
  await writeFile(filePath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

export default async function AdminProjectsPage() {
  const raw = await readFile(filePath, "utf-8")
  const projects = JSON.parse(raw) as any[]
  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground">Manage portfolio entries displayed on the site</p>
          </div>
          <AddModal
            trigger={<><Plus className="w-4 h-4" /> Add New</>}
            title="Add Project"
            description="Create a new portfolio entry"
          >
            <form action={addProject} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ID</label>
                  <SelectOnFocusInput name="id" placeholder="unique-id" className="w-full p-2 border border-border/40 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Year</label>
                  <SelectOnFocusInput name="year" placeholder="2024" className="w-full p-2 border border-border/40 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title</label>
                <SelectOnFocusInput name="title" placeholder="Project title" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Location</label>
                <SelectOnFocusInput name="location" placeholder="City, Country" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type</label>
                <SelectOnFocusInput name="type" placeholder="Residential / Commercial" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
                  <SelectOnFocusInput name="image" placeholder="/path/to/image.png" className="w-full p-2 border border-border/40 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Upload Image</label>
                  <input type="file" name="imageFile" accept="image/*" className="w-full p-2 border border-border/40 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Additional Images (URLs)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SelectOnFocusInput name="images" placeholder="/path/to/image-1.png" className="w-full p-2 border border-border/40 rounded" />
                  <SelectOnFocusInput name="images" placeholder="/path/to/image-2.png" className="w-full p-2 border border-border/40 rounded" />
                  <SelectOnFocusInput name="images" placeholder="/path/to/image-3.png" className="w-full p-2 border border-border/40 rounded" />
                  <SelectOnFocusInput name="images" placeholder="/path/to/image-4.png" className="w-full p-2 border border-border/40 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <SelectOnFocusTextarea name="description" placeholder="Short description" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <BlogAiTools descriptionName="description" imageName="image" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Services</label>
                <SelectOnFocusInput name="services" placeholder="Comma-separated" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <button className="w-full bg-primary text-white py-2 rounded-md inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </form>
          </AddModal>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by title or location"
              className="w-full pl-10 pr-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button className="px-3 py-2 rounded-md border border-border/40 text-sm hover:border-primary/60 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">All</button>
            <button className="px-3 py-2 rounded-md border border-border/40 text-sm hover:border-primary/60 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Residential</button>
            <button className="px-3 py-2 rounded-md border border-border/40 text-sm hover:border-primary/60 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Commercial</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center">
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={p.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-1 rounded text-xs">
                    <Calendar className="w-3 h-3" />
                    {p.year}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-1 rounded text-xs">
                    {p.type}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-foreground mb-1">{p.title}</div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {p.location}
                </div>
                {Array.isArray(p.services) && p.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.services.map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      
    </div>
  )
}