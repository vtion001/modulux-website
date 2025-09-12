import { LazyImage } from "@/components/lazy-image"
import Link from "next/link"

const blogPosts = [
  {
    id: "modern-kitchen-trends-2025",
    title: "Modern Kitchen Trends 2025: What's Hot in Cabinet Design",
    excerpt:
      "Discover the latest trends in kitchen cabinet design that are shaping homes in 2025. From sustainable materials to smart storage solutions.",
    image: "/placeholder.svg?height=300&width=500&text=Modern+Kitchen+Trends",
    author: "ModuLux Design Team",
    date: "January 8, 2025",
    readTime: "5 min read",
    category: "Design Trends",
  },
  {
    id: "maximizing-small-spaces",
    title: "Maximizing Small Spaces: Smart Cabinet Solutions for Compact Homes",
    excerpt:
      "Learn how to make the most of limited space with innovative cabinet designs and storage solutions that don't compromise on style.",
    image: "/placeholder.svg?height=300&width=500&text=Small+Space+Solutions",
    author: "Sarah Chen",
    date: "January 5, 2025",
    readTime: "7 min read",
    category: "Space Planning",
  },
  {
    id: "sustainable-cabinet-materials",
    title: "Sustainable Cabinet Materials: Eco-Friendly Choices for Your Home",
    excerpt:
      "Explore environmentally conscious cabinet materials that combine sustainability with luxury and durability.",
    image: "/placeholder.svg?height=300&width=500&text=Sustainable+Materials",
    author: "Michael Torres",
    date: "January 2, 2025",
    readTime: "6 min read",
    category: "Sustainability",
  },
  {
    id: "walk-in-closet-organization",
    title: "Walk-in Closet Organization: Creating Your Dream Wardrobe Space",
    excerpt:
      "Transform your walk-in closet into an organized, luxurious space with custom cabinet solutions and smart organization systems.",
    image: "/placeholder.svg?height=300&width=500&text=Walk-in+Closet+Design",
    author: "Lisa Rodriguez",
    date: "December 28, 2024",
    readTime: "8 min read",
    category: "Organization",
  },
  {
    id: "bathroom-vanity-styles",
    title: "Bathroom Vanity Styles: From Classic to Contemporary",
    excerpt:
      "Explore different bathroom vanity styles and find the perfect design to complement your bathroom's aesthetic.",
    image: "/placeholder.svg?height=300&width=500&text=Bathroom+Vanity+Styles",
    author: "David Kim",
    date: "December 25, 2024",
    readTime: "4 min read",
    category: "Bathroom Design",
  },
  {
    id: "cabinet-maintenance-tips",
    title: "Cabinet Maintenance Tips: Keeping Your Investment Looking New",
    excerpt:
      "Essential maintenance tips to preserve the beauty and functionality of your modular cabinets for years to come.",
    image: "/placeholder.svg?height=300&width=500&text=Cabinet+Maintenance",
    author: "ModuLux Care Team",
    date: "December 22, 2024",
    readTime: "5 min read",
    category: "Maintenance",
  },
]

const categories = [
  "All",
  "Design Trends",
  "Space Planning",
  "Sustainability",
  "Organization",
  "Bathroom Design",
  "Maintenance",
]

export default function BlogPage() {
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
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full border border-border/40 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-card rounded-lg shadow-sm border border-border/40 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <LazyImage src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-3 line-clamp-2">{post.title}</h2>
                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{post.author}</p>
                      <p>{post.date}</p>
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
