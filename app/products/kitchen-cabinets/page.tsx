"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function KitchenCabinetsPage() {
  const [heroImage, setHeroImage] = useState("/modern-luxury-kitchen-with-emerald-green-modular-c.png")
  const [heroDesc, setHeroDesc] = useState(
    "Transform your kitchen with our premium modular cabinet solutions. Designed for functionality, built for beauty, and crafted to last a lifetime."
  )
  const [features, setFeatures] = useState<string[]>([
    "Premium European hardware",
    "Soft-close hinges and drawers",
    "Water-resistant materials",
    "Custom sizing available",
    "Professional installation",
    "10-year warranty",
  ])

  const [specifications, setSpecifications] = useState<Array<{ label: string; value: string }>>([
    { label: "Material", value: "Marine Plywood, MDF, Solid Wood" },
    { label: "Finish", value: "Melamine, Lacquer, Veneer" },
    { label: "Hardware", value: "Blum, Hettich Premium" },
    { label: "Thickness", value: "18mm - 25mm" },
    { label: "Installation", value: "Professional Team" },
    { label: "Warranty", value: "10 Years" },
  ])
  const [gallery, setGallery] = useState<string[]>([
    "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
    "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
    "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
  ])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/products?id=kitchen-cabinets`)
        const data = await res.json()
        const item = data?.item
        if (item) {
          if (item.image) setHeroImage(item.image)
          if (item.description) setHeroDesc(item.description)
          if (Array.isArray(item.features) && item.features.length) setFeatures(item.features)
          if (item.specs && typeof item.specs === "object") {
            const specMap = item.specs
            const list = [
              { label: "Material", value: String(specMap.material || "") },
              { label: "Finish", value: String(specMap.finish || "") },
              { label: "Hardware", value: String(specMap.hardware || "") },
              { label: "Thickness", value: String(specMap.thickness || "") },
              { label: "Installation", value: String(specMap.installation || "") },
              { label: "Warranty", value: String(specMap.warranty || "") },
            ].filter((s) => s.value)
            if (list.length) setSpecifications(list)
          }
          if (Array.isArray(item.gallery) && item.gallery.length) setGallery(item.gallery)
        }
      } catch {}
    })()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/products" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Kitchen Cabinets</h1>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">{heroDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact">Get Free Quote</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/projects">View Projects</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <img src={heroImage} alt="Kitchen Cabinets" className="w-full h-auto rounded-2xl shadow-2xl mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl font-bold text-foreground mb-8">Premium Features</h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <div className="w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center mr-4">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-8">Specifications</h2>
              <div className="space-y-6">
                {specifications.map((spec, index) => (
                  <motion.div
                    key={spec.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border-b border-border pb-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{spec.label}</span>
                      <span className="text-muted-foreground">{spec.value}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-foreground mb-6">Gallery</h2>
            <p className="text-xl text-muted-foreground">See our kitchen cabinet installations in action</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="aspect-square rounded-xl overflow-hidden"
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Kitchen Cabinet ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Transform Your Kitchen?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Contact us today for a free consultation and personalized quote
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Get Started Today</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
