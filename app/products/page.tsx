"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Wrench, Home, Bath, Shirt, Sofa } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  const products = [
    {
      title: "Kitchen Cabinets",
      description: "Custom modular kitchen solutions with premium materials and modern designs",
      icon: <Home className="w-8 h-8" />,
      href: "/products/kitchen-cabinets",
      image: "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
    },
    {
      title: "Wardrobes",
      description: "Elegant wardrobe systems with optimized storage and sleek finishes",
      icon: <Shirt className="w-8 h-8" />,
      href: "/products/wardrobes",
      image: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png",
    },
    {
      title: "Bathroom Vanities",
      description: "Sophisticated bathroom storage solutions with water-resistant materials",
      icon: <Bath className="w-8 h-8" />,
      href: "/products/bathroom-vanities",
      image: "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
    },
    {
      title: "Walk-in Closets",
      description: "Luxurious walk-in closet systems with customizable layouts",
      icon: <Wrench className="w-8 h-8" />,
      href: "/products/walk-in-closets",
      image: "/luxury-home-office-with-emerald-green-modular-cabi.png",
    },
    {
      title: "Bespoke Furniture",
      description: "Custom-designed furniture pieces tailored to your specific needs",
      icon: <Sofa className="w-8 h-8" />,
      href: "/products/bespoke-furniture",
      image: "/elegant-living-room-with-built-in-emerald-green-mo.png",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Our Products</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Discover our comprehensive range of premium modular solutions designed to transform your living spaces
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link href={product.href}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-accent">{product.icon}</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 text-pretty">{product.description}</p>
                      <Button variant="ghost" className="group/btn p-0 h-auto font-medium">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Ready to Transform Your Space?</h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Contact us today for a free consultation and discover how our premium modular solutions can enhance your
              home
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Get Free Quote</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/projects">View Projects</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
