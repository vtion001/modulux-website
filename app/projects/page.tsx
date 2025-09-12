"use client"

import { motion } from "framer-motion"
import { MapPin, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function ProjectsPage() {
  const projects = [
    {
      id: "rizal-avenue-penthouse",
      title: "Rizal Avenue Penthouse",
      location: "Rizal Avenue, Puerto Princesa City, Palawan",
      year: "2022",
      type: "Penthouse",
      description: "Modern kitchen cabinets and lavatory mirror cabinet installation for luxury penthouse",
      image: "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
      services: ["Kitchen Cabinets", "Lavatory Mirror Cabinet"],
    },
    {
      id: "skylight-hotel-kitchen",
      title: "Skylight Hotel Kitchen",
      location: "Rizal Avenue, Palawan",
      year: "2022",
      type: "Commercial",
      description: "Complete kitchen cabinetry and countertop supply and installation for hotel project",
      image: "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
      services: ["Kitchen Cabinets", "Countertop Installation"],
    },
    {
      id: "wtei-inc-mansion",
      title: "WTEI Inc Mansion",
      location: "Bancao Bancao, Puerto Princesa City, Palawan",
      year: "2022",
      type: "Mansion",
      description: "Lavatory cabinets and walk-in closet cabinets for luxury mansion",
      image: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png",
      services: ["Lavatory Cabinets", "Walk-in Closet"],
    },
    {
      id: "garcia-mansion-kitchen",
      title: "Garcia Mansion Kitchen",
      location: "Narra, Palawan",
      year: "2022",
      type: "Mansion",
      description: "Modular kitchen and countertop supply and installation for residential mansion",
      image: "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
      services: ["Modular Kitchen", "Countertop Installation"],
    },
    {
      id: "mr-palanca-house",
      title: "Mr. Palanca House",
      location: "Wescom Road, Puerto Princesa City, Palawan",
      year: "2023",
      type: "Bungalow",
      description: "Complete kitchen renovation with modular cabinets and premium countertops",
      image: "/luxury-home-office-with-emerald-green-modular-cabi.png",
      services: ["Kitchen Cabinets", "Countertop Installation"],
    },
    {
      id: "contemporary-office-space",
      title: "Contemporary Office Space",
      location: "Puerto Princesa City, Palawan",
      year: "2023",
      type: "Commercial",
      description: "Custom office furniture and storage solutions for modern workspace",
      image: "/elegant-living-room-with-built-in-emerald-green-mo.png",
      services: ["Office Furniture", "Storage Solutions"],
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
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Our Projects</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Discover our portfolio of exceptional modular cabinet installations across Palawan and beyond
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/projects/${project.id}`}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "/modern-kitchen-cabinet-installation.jpg"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-sm font-medium mb-1">{project.type}</div>
                        <div className="text-xs opacity-90">{project.year}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.location}
                      </div>
                      <p className="text-muted-foreground mb-4 text-sm text-pretty">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.services.map((service) => (
                          <span key={service} className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Project Statistics</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Our commitment to excellence reflected in numbers
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "300+", label: "Projects Completed", icon: <Calendar className="w-8 h-8" /> },
              { number: "300+", label: "Happy Clients", icon: <Users className="w-8 h-8" /> },
              { number: "10+", label: "Years of Combined Excellence", icon: <MapPin className="w-8 h-8" /> },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center bg-card border border-border rounded-xl p-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 text-accent rounded-full mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
