"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Image as ImageIcon } from "lucide-react"

type Product = { id: string; name: string; category?: string; image?: string }

export default function ProductCard({ product }: { product: Product }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group"
    >
      <Link href={`/products/${product.id}`}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300">
          <div className="aspect-[4/3] relative overflow-hidden">
            {!loaded && !error && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            {!error ? (
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              {product.category && (
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {product.category}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="group/btn p-0 h-auto font-medium">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <div className="text-xs text-muted-foreground">{loaded ? "Ready" : "Loading"}</div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

import { useState } from "react"