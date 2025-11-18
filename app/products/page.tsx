import path from "path"
import { readFile } from "fs/promises"
import Link from "next/link"
import ProductsGrid from "@/components/products/products-grid"
import { Button } from "@/components/ui/button"
 

const filePath = path.join(process.cwd(), "data", "products.json")

export default async function ProductsPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const items = JSON.parse(raw) as Array<{ id: string; name: string; category?: string; image?: string }>
  const fallback = [
    { id: "kitchen-cabinets", name: "Kitchen Cabinets", category: "Kitchen", image: "/modern-luxury-kitchen-with-emerald-green-modular-c.png" },
    { id: "wardrobes", name: "Wardrobes", category: "Wardrobes", image: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png" },
    { id: "bathroom-vanities", name: "Bathroom Vanities", category: "Bathroom", image: "/luxury-kitchen-with-emerald-green-modular-cabinets.png" },
    { id: "walk-in-closets", name: "Walk-in Closets", category: "Closets", image: "/luxury-home-office-with-emerald-green-modular-cabi.png" },
    { id: "bespoke-furniture", name: "Bespoke Furniture", category: "Furniture", image: "/elegant-living-room-with-built-in-emerald-green-mo.png" },
  ]
  const products = items.length ? items : fallback

 

  return (
    <main className="min-h-screen bg-background">
      <section aria-labelledby="products-title" role="region" className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="container mx-auto px-4">
          <div className="group text-center max-w-4xl mx-auto">
            <h1 id="products-title" className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance animate-in">Our Products</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty slide-in-from-bottom-2">
              Discover our comprehensive range of premium modular solutions designed to transform your living spaces
            </p>
            <div className="mx-auto h-px w-24 bg-gradient-to-r from-primary to-accent opacity-80 transition-all duration-300 group-hover:w-32" />
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="#products-grid">
                <Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Browse All<span className="ml-2">→</span></Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Get a Free Quote<span className="ml-2">→</span></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" id="products-grid">
        <div className="container mx-auto px-4">
          <ProductsGrid products={products} />
        </div>
      </section>

      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
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
          </div>
        </div>
      </section>
    </main>
  )
}
