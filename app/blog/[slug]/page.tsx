import { LazyImage } from "@/components/lazy-image"
import Link from "next/link"

// This would typically come from a CMS or database
const getBlogPost = (slug: string) => {
  const posts = {
    "modern-kitchen-trends-2025": {
      title: "Modern Kitchen Trends 2025: What's Hot in Cabinet Design",
      content: `
        <p>The kitchen continues to be the heart of the home, and 2025 brings exciting new trends in cabinet design that blend functionality with stunning aesthetics. As we move into this new year, homeowners are seeking cabinet solutions that not only look beautiful but also enhance their daily living experience.</p>

        <h2>1. Sustainable Materials Take Center Stage</h2>
        <p>Environmental consciousness is driving cabinet design choices. Bamboo, reclaimed wood, and low-VOC finishes are becoming increasingly popular. These materials offer durability while reducing environmental impact.</p>

        <h2>2. Mixed Material Combinations</h2>
        <p>Gone are the days of uniform cabinet materials. 2025 sees the rise of mixed materials - combining wood with metal accents, glass panels with solid doors, and matte finishes with glossy highlights.</p>

        <h2>3. Smart Storage Solutions</h2>
        <p>Technology integration continues to evolve with smart storage solutions. Pull-out drawers with built-in charging stations, automated lighting systems, and app-controlled cabinet features are becoming standard.</p>

        <h2>4. Bold Color Choices</h2>
        <p>While white kitchens remain popular, bold colors are making a statement. Deep forest greens, navy blues, and warm terracotta tones are trending for those seeking personality in their kitchen design.</p>

        <h2>Conclusion</h2>
        <p>The future of kitchen cabinet design is bright, sustainable, and highly functional. At ModuLux, we're committed to staying ahead of these trends while maintaining our focus on quality craftsmanship and customer satisfaction.</p>
      `,
      image: "/placeholder.svg?height=400&width=800&text=Modern+Kitchen+Trends",
      author: "ModuLux Design Team",
      date: "January 8, 2025",
      readTime: "5 min read",
      category: "Design Trends",
    },
  }

  return posts[slug as keyof typeof posts] || null
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug)

  if (!post) {
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
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">{post.readTime}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{post.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <span>By {post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>
        </header>

        {/* Featured Image */}
        <LazyImage src={post.image} alt={post.title} className="w-full h-64 md:h-96 object-cover rounded-lg mb-8" />

        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

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
