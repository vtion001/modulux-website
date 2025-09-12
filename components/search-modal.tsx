"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LazyImage } from "./lazy-image"

interface SearchResult {
  id: string
  title: string
  type: "product" | "project" | "blog"
  url: string
  image?: string
  description: string
}

const searchData: SearchResult[] = [
  {
    id: "kitchen-cabinets",
    title: "Kitchen Cabinets",
    type: "product",
    url: "/products/kitchen-cabinets",
    image: "/placeholder.svg?height=60&width=60&text=Kitchen",
    description: "Premium modular kitchen cabinet solutions",
  },
  {
    id: "wardrobes",
    title: "Wardrobes",
    type: "product",
    url: "/products/wardrobes",
    image: "/placeholder.svg?height=60&width=60&text=Wardrobe",
    description: "Custom wardrobe and closet systems",
  },
  {
    id: "bathroom-vanities",
    title: "Bathroom Vanities",
    type: "product",
    url: "/products/bathroom-vanities",
    image: "/placeholder.svg?height=60&width=60&text=Bathroom",
    description: "Elegant bathroom vanity solutions",
  },
  {
    id: "rizal-avenue-project",
    title: "Rizal Avenue Penthouse",
    type: "project",
    url: "/projects/rizal-avenue-project",
    image: "/placeholder.svg?height=60&width=60&text=Project",
    description: "Luxury penthouse kitchen and bathroom renovation",
  },
  {
    id: "modern-kitchen-trends",
    title: "Modern Kitchen Trends 2025",
    type: "blog",
    url: "/blog/modern-kitchen-trends-2025",
    image: "/placeholder.svg?height=60&width=60&text=Blog",
    description: "Latest trends in kitchen cabinet design",
  },
]

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (query.trim()) {
      const filtered = searchData.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()),
      )
      setResults(filtered)
    } else {
      setResults([])
    }
  }, [query])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center min-h-screen pt-16 px-4">
        <div className="bg-background rounded-lg shadow-xl border border-border/40 w-full max-w-2xl">
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search products, projects, or blog posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
                autoFocus
              />
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors duration-200"
                  >
                    {result.image && (
                      <LazyImage src={result.image} alt={result.title} className="w-12 h-12 rounded-md object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{result.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            result.type === "product"
                              ? "bg-primary/10 text-primary"
                              : result.type === "project"
                                ? "bg-secondary/10 text-secondary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!query.trim() && (
              <div className="p-8 text-center text-muted-foreground">
                <p>Start typing to search products, projects, and blog posts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
