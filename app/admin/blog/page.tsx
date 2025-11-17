import path from "path"
import { revalidatePath } from "next/cache"
import { readFile, writeFile } from "fs/promises"
import { Calendar, Pencil, Trash2, Search, Plus, Wand2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { BlogAiTools } from "@/components/admin/blog-ai-tools"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { AddModal } from "@/components/admin/add-modal"

const filePath = path.join(process.cwd(), "data", "blog.json")

async function addPost(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const title = String(formData.get("title") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const image = String(formData.get("image") || "").trim()
  const author = String(formData.get("author") || "").trim()
  const date = String(formData.get("date") || "").trim()
  const readTime = String(formData.get("readTime") || "").trim()
  const category = String(formData.get("category") || "").trim()
  if (!id || !title) return
  const raw = await readFile(filePath, "utf-8")
  const list = JSON.parse(raw)
  if (list.find((p: any) => p.id === id)) return
  list.unshift({
    id,
    title,
    excerpt,
    description,
    image,
    author,
    date: date || new Date().toISOString(),
    readTime,
    category,
  })
  await writeFile(filePath, JSON.stringify(list, null, 2))
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}

async function deletePost(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return
  const raw = await readFile(filePath, "utf-8")
  const list = JSON.parse(raw)
  const next = list.filter((p: any) => p.id !== id)
  await writeFile(filePath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}

export default async function AdminBlogPage() {
  const raw = await readFile(filePath, "utf-8")
  const posts = JSON.parse(raw) as any[]
  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Blog</h1>
            <p className="text-sm text-muted-foreground">Manage articles displayed on the site</p>
          </div>
          <AddModal trigger={<><Plus className="w-4 h-4" /> Add New</>} title="Add Post" description="Create a new article">
            <form action={addPost} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectOnFocusInput name="id" placeholder="id" className="w-full p-2 border border-border/40 rounded" />
                <SelectOnFocusInput name="title" placeholder="title" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectOnFocusInput name="category" placeholder="category" className="w-full p-2 border border-border/40 rounded" />
                <SelectOnFocusInput name="readTime" placeholder="read time (e.g., 5 min read)" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectOnFocusInput name="author" placeholder="author" className="w-full p-2 border border-border/40 rounded" />
                <SelectOnFocusInput name="date" placeholder="date (e.g., January 8, 2025)" className="w-full p-2 border border-border/40 rounded" />
              </div>
              <SelectOnFocusInput name="excerpt" placeholder="excerpt" className="w-full p-2 border border-border/40 rounded" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <SelectOnFocusTextarea name="description" placeholder="Write your article..." className="w-full p-2 border border-border/40 rounded min-h-32" />
              </div>
              <SelectOnFocusInput name="image" placeholder="image url" className="w-full p-2 border border-border/40 rounded" />
              <BlogAiTools descriptionName="description" imageName="image" />
              <button className="w-full bg-primary text-white py-2 rounded transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Add</button>
            </form>
          </AddModal>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <SelectOnFocusInput
              placeholder="Search by title"
              className="w-full pl-10 pr-3 py-2 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center">
                <img src={p.image || "/placeholder.svg"} alt={p.title} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-1 rounded text-xs">
                  <Calendar className="w-3 h-3" />
                  {p.date ? new Date(p.date).toLocaleDateString() : "—"}
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-foreground mb-1">{p.title}</div>
                <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/blog/${p.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <form action={deletePost}>
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