"use client"

import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export default function GalleryPage() {
  const galleryRef = useRef(null)
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" })

  return (
    <div className="min-h-screen bg-background">
      {/* Gallery Section */}
      <section className="py-20 bg-background" ref={galleryRef}>
        <div className="container mx-auto px-4">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center text-primary mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            Our Gallery
          </motion.h1>

          <motion.p
            className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Explore Our Designs
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              {
                src: "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
                alt: "Modern Kitchen Design",
                span: "",
              },
              { src: "/elegant-living-room-with-built-in-emerald-green-mo.png", alt: "Living Room Storage", span: "" },
              { src: "/luxury-home-office-with-emerald-green-modular-cabi.png", alt: "Home Office Design", span: "" },
              {
                src: "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
                alt: "Kitchen & Dining Integration",
                span: "lg:col-span-2",
              },
              { src: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png", alt: "Bedroom Storage", span: "" },
            ].map((image, index) => (
              <motion.div
                key={index}
                className={`group relative overflow-hidden rounded-xl aspect-[4/3] ${image.span}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <motion.div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ y: 20 }}
                  whileHover={{ y: 0 }}
                >
                  <div className="text-white text-center">
                    <h3 className="text-xl font-semibold mb-2">{image.alt}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
