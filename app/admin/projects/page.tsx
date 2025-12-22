import path from "path"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir, readFile } from "fs/promises"
import { MapPin, Calendar, Plus, Search, Trash2, Pencil } from "lucide-react"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { BlogAiTools } from "@/components/admin/blog-ai-tools"
import { AddModal } from "@/components/admin/add-modal"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { supabaseServer } from "@/lib/supabase-server"

const uploadsDir = path.join(process.cwd(), "public", "uploads")
const dataDir = path.join(process.cwd(), "data")
const projectsPath = path.join(dataDir, "projects.json")

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
  const supabase = supabaseServer()
  const { data: exists } = await supabase.from("projects").select("id").eq("id", id)
  if ((exists || []).length) return
  const file = formData.get("imageFile") as File | null
  if (file && typeof file === "object" && file.size > 0) {
    await mkdir(uploadsDir, { recursive: true })
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : ""
    const name = `${id}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, name)
    const bytes = new Uint8Array(await file.arrayBuffer())
    await writeFile(dest, bytes)
    image = `/uploads/${name}`
    images.unshift(image)
  }
  image = sanitize(image) || (images.length ? images[0] : "")
  await supabase.from("projects").insert({ id, title, location, year, type, description, image, images, services })
  const raw = await readFile(projectsPath, "utf-8").catch(() => "[]")
  const prev = JSON.parse(raw || "[]")
  const next = Array.isArray(prev)
    ? [{ id, title, location, year, type, description, image, images, services }, ...prev.filter((p: any) => p.id !== id)]
    : [{ id, title, location, year, type, description, image, images, services }]
  await mkdir(dataDir, { recursive: true })
  await writeFile(projectsPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

async function updateProject(formData: FormData) {
  "use server"
  if (!formData || typeof (formData as any).get !== "function") return { ok: false }
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
  const images = formData
    .getAll("images")
    .map((v) => sanitize(String(v || "")))
    .filter(Boolean) as string[]
  const services = String(formData.get("services") || "").split(",").map((s) => s.trim()).filter(Boolean)
  if (!id || !title) return { ok: false }
  const supabase = supabaseServer()
  const { data: curr } = await supabase.from("projects").select("*").eq("id", id).single()
  if (!curr) return { ok: false }
  try { await supabase.from("project_versions").insert({ id, ts: Date.now(), data: curr }) } catch { }
  const file = formData.get("imageFile") as File | null
  if (file && typeof file === "object" && file.size > 0) {
    await mkdir(uploadsDir, { recursive: true })
    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : ""
    const name = `${id}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, name)
    const bytes = new Uint8Array(await file.arrayBuffer())
    await writeFile(dest, bytes)
    image = `/uploads/${name}`
  }
  image = sanitize(image) || (images.length ? images[0] : (curr.image || ""))
  await supabase.from("projects").update({ title, location, year, type, description, image, images, services }).eq("id", id)
  const raw = await readFile(projectsPath, "utf-8").catch(() => "[]")
  const prev = JSON.parse(raw || "[]")
  const next = Array.isArray(prev)
    ? [
      { id, title, location, year, type, description, image, images, services },
      ...prev.filter((p: any) => p.id !== id),
    ]
    : [
      { id, title, location, year, type, description, image, images, services },
    ]
  await mkdir(dataDir, { recursive: true })
  await writeFile(projectsPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
  return { ok: true, message: "Project changes saved" }
}

async function seedProjects() {
  "use server"
  const supabase = supabaseServer()
  const items = [
    { id: "rizal-avenue-penthouse-kitchen", title: "Puerto Princesa City, Rizal Avenue Penthouse Kitchen Project", location: "Rizal Avenue, Puerto Princesa City, Palawan", year: "2024", type: "Cabinetry", description: "Penthouse kitchen cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763228651/y3wqoymderb4sh87eh3j.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763228651/y3wqoymderb4sh87eh3j.jpg"], services: ["Cabinetry"] },
    { id: "rizal-avenue-kitchen", title: "Puerto Princesa City, Rizal Avenue Kitchen Project", location: "Rizal Avenue, Palawan", year: "2024", type: "Cabinetry", description: "Kitchen cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763230412/momirivjqmguvgarjvak.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763230412/momirivjqmguvgarjvak.jpg"], services: ["Cabinetry"] },
    { id: "abueg-road-kitchen-bath-wic", title: "Puerto Princesa City, Abueg Road Kitchen Bathroom and WIC Project", location: "Bancao Bancao, Puerto Princesa City, Palawan", year: "2024", type: "Cabinetry", description: "Kitchen, bath, and walk-in closet cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763230884/mnaxvkblij98d2yppmav.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763230884/mnaxvkblij98d2yppmav.jpg"], services: ["Cabinetry"] },
    { id: "narra-kitchen", title: "Narra Palawan, Kitchen Project", location: "Narra, Palawan", year: "2024", type: "Cabinetry", description: "Kitchen cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763228628/yxtlcshl1tr5rwexkhcs.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763228628/yxtlcshl1tr5rwexkhcs.jpg"], services: ["Cabinetry"] },
    { id: "wescom-road-kitchen", title: "Puerto Princesa City, Wescom Road Kitchen Project", location: "Wescom Road, Puerto Princesa City, Palawan", year: "2024", type: "Cabinetry", description: "Kitchen cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763228570/bgcaoojrvuktnyyzsmlr.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763228570/bgcaoojrvuktnyyzsmlr.jpg"], services: ["Cabinetry"] },
    { id: "abueg-rd-kitchen", title: "Puerto Princesa City, Abueg Rd Kitchen Project", location: "Puerto Princesa City, Palawan", year: "2024", type: "Cabinetry", description: "Kitchen cabinetry", image: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763228546/neaukknuqfws6djd0m5t.jpg", images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1763228546/neaukknuqfws6djd0m5t.jpg"], services: ["Cabinetry"] },
  ]
  for (const p of items) {
    await supabase.from("projects").upsert(p, { onConflict: "id" })
  }
  await mkdir(dataDir, { recursive: true })
  await writeFile(projectsPath, JSON.stringify(items, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

async function importProjects(formData: FormData) {
  "use server"
  const file = formData.get("backupFile") as File | null
  if (!file || typeof file !== "object" || file.size === 0) return
  const text = await file.text()
  let data: any
  try { data = JSON.parse(text) } catch { return }
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.projects)
      ? data.projects
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : []
  if (!Array.isArray(list) || list.length === 0) return
  const supabase = supabaseServer()
  for (const p of list) {
    const id = String(p.id || "").trim()
    const title = String(p.title || "").trim()
    if (!id || !title) continue
    const location = String(p.location || "")
    const year = String(p.year || "")
    const type = String(p.type || "")
    const description = String(p.description || "")
    const image = String(p.image || "")
    const images = Array.isArray(p.images) ? p.images : []
    const services = Array.isArray(p.services) ? p.services : []
    await supabase.from("projects").upsert({ id, title, location, year, type, description, image, images, services }, { onConflict: "id" })
  }
  await mkdir(dataDir, { recursive: true })
  await writeFile(projectsPath, JSON.stringify(list, null, 2))
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

async function deleteProject(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const supabase = supabaseServer()
  await supabase.from("projects").delete().eq("id", id)
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
}

async function syncProjectsToSupabase() {
  "use server"
  const supabase = supabaseServer()
  const raw = await readFile(projectsPath, "utf-8").catch(() => "[]")
  const local = JSON.parse(raw || "[]")
  const list = Array.isArray(local) ? local : []
  if (!Array.isArray(list) || list.length === 0) return { ok: false }
  for (const p of list) {
    const id = String(p.id || "").trim()
    const title = String(p.title || "").trim()
    if (!id || !title) continue
    const location = String(p.location || "")
    const year = String(p.year || "")
    const type = String(p.type || "")
    const description = String(p.description || "")
    const image = String(p.image || "")
    const images = Array.isArray(p.images) ? p.images : []
    const services = Array.isArray(p.services) ? p.services : []
    await supabase.from("projects").upsert({ id, title, location, year, type, description, image, images, services }, { onConflict: "id" })
  }
  revalidatePath("/admin/projects")
  revalidatePath("/projects")
  revalidatePath("/")
  return { ok: true }
}

export default async function AdminProjectsPage() {
  const supabase = supabaseServer()
  const { data: projectsRaw } = await supabase.from("projects").select("*").order("year", { ascending: false })
  let projects = projectsRaw || []
  if (!Array.isArray(projects) || projects.length === 0) {
    const raw = await readFile(projectsPath, "utf-8").catch(() => "[]")
    const local = JSON.parse(raw || "[]")
    projects = Array.isArray(local) ? local : []
  }
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage portfolio entries displayed on the site</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SaveForm action={seedProjects}>
            <SubmitButton confirm="Are you sure you want to restore sample data? This might overwrite existing entries." className="px-3 py-2 rounded-md border border-border/40 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Restore Sample Data</SubmitButton>
          </SaveForm>
          <SaveForm action={importProjects}>
            <input type="file" name="backupFile" accept="application/json" className="px-3 py-2 rounded-md border border-border/40 text-sm" />
            <SubmitButton confirm="Import this JSON backup? This will add or update projects." className="px-3 py-2 rounded-md border border-border/40 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Import JSON</SubmitButton>
          </SaveForm>
          <SaveForm action={syncProjectsToSupabase}>
            <SubmitButton confirm="Sync local projects to Supabase? This will overwrite data in the database with local files." className="px-3 py-2 rounded-md border border-border/40 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Sync to Supabase</SubmitButton>
          </SaveForm>
          <AddModal
            trigger={<><Plus className="w-4 h-4" /> Add New</>}
            title="Add Project"
            description="Create a new portfolio entry"
          >
            <SaveForm action={addProject} className="space-y-3">
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
              <SubmitButton className="w-full bg-primary text-white py-2 rounded-md inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                <Plus className="w-4 h-4" />
                Add Project
              </SubmitButton>
            </SaveForm>
          </AddModal>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by title or location"
            className="w-full pl-10 pr-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
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
                <AddModal
                  trigger={<><Pencil className="w-4 h-4" /> Edit</>}
                  title="Edit Project"
                  description="Update portfolio entry"
                >
                  <SaveForm action={updateProject} successMessage="Project saved" className="space-y-3">
                    <input type="hidden" name="id" defaultValue={p.id} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Title</label>
                        <SelectOnFocusInput name="title" defaultValue={p.title} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Year</label>
                        <SelectOnFocusInput name="year" defaultValue={p.year} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Location</label>
                        <SelectOnFocusInput name="location" defaultValue={p.location} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Type</label>
                        <SelectOnFocusInput name="type" defaultValue={p.type} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
                        <SelectOnFocusInput name="image" defaultValue={p.image} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Upload Image</label>
                        <input type="file" name="imageFile" accept="image/*" className="w-full p-2 border border-border/40 rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Additional Images (URLs)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SelectOnFocusInput name="images" defaultValue={Array.isArray(p.images) ? p.images[0] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
                        <SelectOnFocusInput name="images" defaultValue={Array.isArray(p.images) ? p.images[1] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
                        <SelectOnFocusInput name="images" defaultValue={Array.isArray(p.images) ? p.images[2] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
                        <SelectOnFocusInput name="images" defaultValue={Array.isArray(p.images) ? p.images[3] || "" : ""} className="w-full p-2 border border-border/40 rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Description</label>
                      <SelectOnFocusTextarea name="description" defaultValue={p.description} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <BlogAiTools descriptionName="description" imageName="image" />
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Services</label>
                      <SelectOnFocusInput name="services" defaultValue={Array.isArray(p.services) ? p.services.join(", ") : ""} className="w-full p-2 border border-border/40 rounded" />
                    </div>
                    <SubmitButton confirm="Save project?" className="w-full bg-primary text-white py-2 rounded-md inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                      Save Changes
                    </SubmitButton>
                  </SaveForm>
                </AddModal>
                <SaveForm action={deleteProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <SubmitButton
                    type="danger"
                    confirm={`Are you sure you want to delete "${p.title}"? This action cannot be undone.`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </SubmitButton>
                </SaveForm>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
