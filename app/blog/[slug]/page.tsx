import { LazyImage } from "@/components/lazy-image"
import Link from "next/link"
import { supabaseServer } from "@/lib/supabase-server"
import path from "path"
import { readFile } from "fs/promises"

type Post = {
  id: string
  title: string
  excerpt?: string
  description?: string
  image?: string
  author?: string
  date?: string
  readTime?: string
  category?: string
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServer()
  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", params.slug).single()

  let fallbackPost: any = post || null
  if (!fallbackPost) {
    try {
      const blogPath = path.join(process.cwd(), "data", "blog_posts.json")
      const raw = await readFile(blogPath, "utf-8").catch(() => "[]")
      const local = JSON.parse(raw || "[]")
      const match = Array.isArray(local) ? local.find((p: any) => String(p.id || "") === params.slug) : null
      if (match) fallbackPost = match
    } catch {}
  }

  if (!fallbackPost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-primary hover:text-primary/80">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back to Blog */}
        <Link href="/blog" className="text-primary hover:text-primary/80 mb-8 inline-block">
          ← Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {fallbackPost.category || "Article"}
            </span>
            <span className="text-sm text-muted-foreground">{(fallbackPost.readTime||fallbackPost.read_time) || ""}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{fallbackPost.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <span>By {fallbackPost.author || "ModuLux"}</span>
            <span className="mx-2">•</span>
            <span>{fallbackPost.date || ""}</span>
          </div>
        </header>

        {/* Featured Image */}
        <LazyImage src={fallbackPost.image || "/placeholder.svg"} alt={fallbackPost.title} className="w-full h-64 md:h-96 object-cover object-center rounded-lg mb-8" />

        {/* Article Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
          {(() => {
            const content = String(fallbackPost.description || fallbackPost.excerpt || "")
            const paras = content.split(/\r?\n\s*\r?\n/).filter(Boolean)
            return paras.length
              ? paras.map((c, i) => (
                  <p key={i} className="whitespace-pre-wrap leading-relaxed mb-4">
                    {c}
                  </p>
                ))
              : <p className="whitespace-pre-wrap leading-relaxed mb-4">{content}</p>
          })()}
        </div>

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <h3 className="text-lg font-semibold text-foreground mb-4">Share this article</h3>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200">
              Facebook
            </button>
            <button className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200">
              Twitter
            </button>
            <button className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors duration-200">
              LinkedIn
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
