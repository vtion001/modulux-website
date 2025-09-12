"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Building, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const projectsData = {
  "rizal-avenue-penthouse": {
    title: "Rizal Avenue Penthouse",
    location: "Rizal Avenue, Puerto Princesa City, Palawan",
    year: "2022",
    type: "Penthouse",
    client: "Private Residence",
    description:
      "A sophisticated penthouse transformation featuring modern kitchen cabinets and elegant lavatory mirror cabinets. This project showcases our ability to blend contemporary design with functional storage solutions in a luxury residential setting.",
    services: ["Kitchen Cabinets", "Lavatory Mirror Cabinet", "Custom Countertops", "Professional Installation"],
    images: [
      "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
      "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
      "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
    ],
    details: {
      duration: "6 weeks",
      area: "2,500 sq ft",
      budget: "₱2,500,000 - ₱3,000,000",
      materials: ["Marine Plywood", "Quartz Countertops", "Premium Hardware"],
    },
  },
  "skylight-hotel-kitchen": {
    title: "Skylight Hotel Kitchen",
    location: "Rizal Avenue, Palawan",
    year: "2022",
    type: "Commercial",
    client: "Skylight Hotel",
    description:
      "Complete commercial kitchen renovation for a luxury hotel, featuring durable cabinetry and professional-grade countertops designed to withstand high-volume operations while maintaining aesthetic appeal.",
    services: ["Commercial Kitchen Cabinets", "Countertop Installation", "Storage Solutions", "Equipment Integration"],
    images: [
      "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
      "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
      "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
    ],
    details: {
      duration: "8 weeks",
      area: "1,800 sq ft",
      budget: "₱3,500,000 - ₱4,000,000",
      materials: ["Stainless Steel", "Commercial Grade Plywood", "Heat-Resistant Surfaces"],
    },
  },
  "wtei-inc-mansion": {
    title: "WTEI Inc Mansion",
    location: "Bancao Bancao, Puerto Princesa City, Palawan",
    year: "2022",
    type: "Mansion",
    client: "WTEI Inc",
    description:
      "Luxury mansion project featuring custom lavatory cabinets and spacious walk-in closet systems. This project demonstrates our expertise in creating cohesive storage solutions throughout large residential properties.",
    services: ["Lavatory Cabinets", "Walk-in Closet Systems", "Custom Mirrors", "Lighting Integration"],
    images: [
      "/luxury-bedroom-with-emerald-green-modular-wardrobe.png",
      "/luxury-home-office-with-emerald-green-modular-cabi.png",
      "/elegant-living-room-with-built-in-emerald-green-mo.png",
    ],
    details: {
      duration: "10 weeks",
      area: "4,200 sq ft",
      budget: "₱4,500,000 - ₱5,500,000",
      materials: ["Solid Wood", "Premium Veneers", "Luxury Hardware"],
    },
  },
  "garcia-mansion-kitchen": {
    title: "Garcia Mansion Kitchen",
    location: "Narra, Palawan",
    year: "2022",
    type: "Mansion",
    client: "Garcia Family",
    description:
      "Elegant mansion kitchen featuring modular cabinetry and premium countertops. The design emphasizes both functionality and luxury, creating a space perfect for both daily use and entertaining.",
    services: ["Modular Kitchen Design", "Countertop Installation", "Custom Storage", "Appliance Integration"],
    images: [
      "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
      "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
      "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
    ],
    details: {
      duration: "7 weeks",
      area: "3,000 sq ft",
      budget: "₱3,200,000 - ₱3,800,000",
      materials: ["Marine Plywood", "Granite Countertops", "European Hardware"],
    },
  },
  "mr-palanca-house": {
    title: "Mr. Palanca House",
    location: "Wescom Road, Puerto Princesa City, Palawan",
    year: "2023",
    type: "Bungalow",
    client: "Palanca Family",
    description:
      "Complete kitchen renovation for a modern bungalow, featuring sleek modular cabinets and premium countertops that maximize space efficiency while maintaining contemporary aesthetics.",
    services: ["Kitchen Renovation", "Modular Cabinets", "Countertop Installation", "Space Optimization"],
    images: [
      "/luxury-home-office-with-emerald-green-modular-cabi.png",
      "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
      "/elegant-living-room-with-built-in-emerald-green-mo.png",
    ],
    details: {
      duration: "5 weeks",
      area: "1,500 sq ft",
      budget: "₱1,800,000 - ₱2,200,000",
      materials: ["Engineered Wood", "Quartz Surfaces", "Soft-Close Hardware"],
    },
  },
  "contemporary-office-space": {
    title: "Contemporary Office Space",
    location: "Puerto Princesa City, Palawan",
    year: "2023",
    type: "Commercial",
    client: "Corporate Client",
    description:
      "Modern office furniture and storage solutions designed to enhance productivity and create an inspiring work environment. Features custom-built desks, storage units, and collaborative spaces.",
    services: ["Office Furniture Design", "Storage Solutions", "Workspace Planning", "Custom Installations"],
    images: [
      "/elegant-living-room-with-built-in-emerald-green-mo.png",
      "/luxury-home-office-with-emerald-green-modular-cabi.png",
      "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
    ],
    details: {
      duration: "4 weeks",
      area: "2,000 sq ft",
      budget: "₱2,000,000 - ₱2,500,000",
      materials: ["Laminated Boards", "Metal Accents", "Ergonomic Components"],
    },
  },
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const project = projectsData[params.id as keyof typeof projectsData]

  if (!project) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Project Not Found</h1>
          <Button asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </main>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % project.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/projects" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">{project.title}</h1>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {project.location}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {project.year}
              </div>
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                {project.type}
              </div>
            </div>
            <p className="text-xl text-muted-foreground text-pretty">{project.description}</p>
          </motion.div>
        </div>
      </section>

      {/* Image Carousel */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6">
              <img
                src={project.images[currentImageIndex] || "/placeholder.svg"}
                alt={`${project.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {project.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {project.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${project.title} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl font-bold text-foreground mb-8">Project Details</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Client</h3>
                  <p className="text-muted-foreground">{project.client}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Duration</h3>
                  <p className="text-muted-foreground">{project.details.duration}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Area</h3>
                  <p className="text-muted-foreground">{project.details.area}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Budget Range</h3>
                  <p className="text-muted-foreground">{project.details.budget}</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-8">Services Provided</h2>
              <div className="space-y-4 mb-8">
                {project.services.map((service, index) => (
                  <div key={service} className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-4" />
                    <span className="text-foreground">{service}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Materials Used</h3>
              <div className="space-y-2">
                {project.details.materials.map((material, index) => (
                  <div key={material} className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-4" />
                    <span className="text-muted-foreground">{material}</span>
                  </div>
                ))}
              </div>
            </motion.div>
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
            <h2 className="text-4xl font-bold text-foreground mb-6">Inspired by This Project?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let us create something equally stunning for your space. Contact us for a free consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Start Your Project</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/projects">View More Projects</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
