import { revalidatePath } from "next/cache"
import Link from "next/link"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { BlogAiTools } from "@/components/admin/blog-ai-tools"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { supabaseServer } from "@/lib/supabase-server"


async function updatePost(prevState: any, formData: FormData) {
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
  if (!id || !title) return { ok: false }
  const supabase = supabaseServer()
  await supabase.from("blog_posts").update({ title, excerpt, description, image, author, date, read_time: readTime, category }).eq("id", id)
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  return { ok: true, message: "Post updated" }
}

export default async function AdminBlogEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", params.id).single()
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <Link href="/admin/blog" className="text-sm text-primary">Back to Blog</Link>
      </div>
      {post ? (
        <SaveForm action={updatePost}>
          <input type="hidden" name="id" defaultValue={post.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <SelectOnFocusInput name="title" defaultValue={post.title} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <SelectOnFocusInput name="category" defaultValue={post.category || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Author</label>
              <SelectOnFocusInput name="author" defaultValue={post.author || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Date</label>
              <SelectOnFocusInput name="date" defaultValue={post.date || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Read Time</label>
              <SelectOnFocusInput name="readTime" defaultValue={post.readTime || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
              <SelectOnFocusInput name="image" defaultValue={post.image || ""} className="w-full p-2 border border-border/40 rounded" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Excerpt</label>
            <SelectOnFocusInput name="excerpt" defaultValue={post.excerpt || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <SelectOnFocusTextarea name="description" defaultValue={post.description || ""} className="w-full p-2 border border-border/40 rounded min-h-32" />
          </div>
          <BlogAiTools descriptionName="description" imageName="image" />
          <SubmitButton>Save Changes</SubmitButton>
        </SaveForm>
      ) : (
        <div className="text-muted-foreground">Post not found</div>
      )}
    </div>
  )
}
