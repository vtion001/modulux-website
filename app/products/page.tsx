import path from "path"
import { readFile } from "fs/promises"
import Link from "next/link"
import { ArrowRight, Wrench, Home, Bath, Shirt, Sofa } from "lucide-react"
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

  const iconFor = (name: string) => {
    const n = (name || "").toLowerCase()
    if (n.includes("kitchen")) return <Home className="w-8 h-8" />
    if (n.includes("wardrobe")) return <Shirt className="w-8 h-8" />
    if (n.includes("bath")) return <Bath className="w-8 h-8" />
    if (n.includes("closet")) return <Wrench className="w-8 h-8" />
    if (n.includes("furniture")) return <Sofa className="w-8 h-8" />
    return <Home className="w-8 h-8" />
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Our Products</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Discover our comprehensive range of premium modular solutions designed to transform your living spaces
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group">
                <Link href={`/products/${product.id}`}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-accent">{iconFor(product.name)}</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground mb-4 text-pretty">{product.category || "Explore more details"}</p>
                      <Button variant="ghost" className="group/btn p-0 h-auto font-medium">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
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
