"use client"

import { LazyImage } from "@/components/lazy-image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type Post = {
  id: string
  title: string
  excerpt: string
  description?: string
  image?: string
  author?: string
  date?: string
  readTime?: string
  category?: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState("All")

  useEffect(() => {
    let cancelled = false
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setPosts(data.map((p:any)=>({ ...p, readTime: p.readTime || p.read_time })))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    posts.forEach((p) => p.category && set.add(p.category))
    return Array.from(set)
  }, [posts])

  const visible = useMemo(() => {
    if (category === "All") return posts
    return posts.filter((p) => p.category === category)
  }, [posts, category])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">ModuLux Design Blog</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the latest trends, tips, and insights in modular cabinet design and home organization
          </p>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full border border-border/40 text-sm font-medium transition-all duration-200 ${
                  category === c ? "bg-primary text-white border-primary" : "hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((post) => (
              <article
                key={post.id}
                className="bg-card rounded-lg shadow-sm border border-border/40 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <LazyImage src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {post.category || "Article"}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.readTime || ""}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-3 line-clamp-2">{post.title}</h2>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{post.author || "ModuLux"}</p>
                      <p>{post.date || ""}</p>
                    </div>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-primary hover:text-primary/80 font-medium text-sm transition-colors duration-200"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Stay Updated with ModuLux</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to our newsletter for the latest design trends, tips, and exclusive offers
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-border/40 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
