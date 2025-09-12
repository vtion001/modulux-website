"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BespokeFurniturePage() {
  const features = [
    "Completely custom designs",
    "Premium material selection",
    "Artisan craftsmanship",
    "Unique finishing options",
    "Personalized consultation",
    "Lifetime craftsmanship warranty",
  ]

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
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Bespoke Furniture</h1>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Custom-designed furniture pieces that reflect your unique style and vision. Where artistry meets
                functionality in perfect harmony.
              </p>
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
              <img
                src="/elegant-living-room-with-built-in-emerald-green-mo.png"
                alt="Bespoke Furniture"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl font-bold text-foreground mb-8 text-center">Artisan Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center p-6 bg-card border border-border rounded-xl"
                >
                  <div className="w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center mr-4">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
            <h2 className="text-4xl font-bold text-foreground mb-6">Create Something Unique</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let our master craftsmen bring your vision to life with completely custom furniture pieces
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Begin Your Journey</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
