"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Ruler, Settings, Sparkles, Wrench, Hammer, PaintBucket, Quote, Star } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ServicesPage() {
  const servicesRef = useRef(null)
  const servicesInView = useInView(servicesRef, { once: true, margin: "-100px" })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section aria-labelledby="services-title" role="region" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(800px circle at 10% 10%, rgba(16,185,129,.08) 0%, transparent 60%), radial-gradient(600px circle at 90% 90%, rgba(99,102,241,.08) 0%, transparent 55%)" }} />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 id="services-title" className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Precision Cabinetry Services
          </motion.h1>
          <motion.p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            End‑to‑end solutions from design and fabrication to installation. Engineered for quality, timelines, and sustainability.
          </motion.p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="#services-grid"><Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Explore Services<span className="ml-2">→</span></Button></Link>
            <Link href="/contact"><Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Get a Free Quote<span className="ml-2">→</span></Button></Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services-grid" className="py-20 bg-card relative overflow-hidden" ref={servicesRef}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #D4AF37 2px, transparent 2px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-6" initial={{ opacity: 0, y: 50 }} animate={servicesInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>Our Services</motion.h2>
          <motion.p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto" initial={{ opacity: 0, y: 30 }} animate={servicesInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }}>
            Comprehensive solutions covering design, fabrication, assembly, and installation.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Ruler,
                title: "CNC Router Cutting & Engraving",
                description:
                  "Precision cutting services for all contractors, architects, and interior designers. Our CNC Router Machine processes materials with precision, enabling seamless finishes in engineered materials like melamine marine plywood.",
              },
              {
                icon: PaintBucket,
                title: "Edge Banding Services",
                description:
                  "Professional edge banding service that provides the finishing touch your project needs. Our machine ensures quality finish and seamless adhesion that will last.",
              },
              {
                icon: Settings,
                title: "Kitchen Design & Manufacturing",
                description:
                  "Complete kitchen design, manufacturing, and installation services. From planning and budgeting to design and implementation, we deliver superior results on time and within budget.",
              },
              {
                icon: Hammer,
                title: "Assembly & Installation",
                description:
                  "Professional assembly and installation services for all our modular cabinet solutions. Our experienced team ensures perfect fits and flawless installations.",
              },
              {
                icon: Sparkles,
                title: "Countertop Fabrication",
                description:
                  "Custom countertop fabrication and installation services. We handle material selection, precise measurements, cutting, shaping, and final installation for functional and aesthetic surfaces.",
              },
              {
                icon: Wrench,
                title: "Bespoke Furniture",
                description:
                  "Custom furniture solutions including wardrobes, walk-in closets, bathroom lavatories, toilet partitions, and other bespoke furniture tailored to your specific needs.",
              },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-border/60 bg-background/50 backdrop-blur-sm relative overflow-hidden h-full">
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 text-center relative z-10 h-full flex flex-col">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <service.icon className="w-8 h-8 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-primary mb-4">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed flex-grow">{service.description}</p>
                    <div className="mt-6">
                      <Link href="/projects"><Button variant="ghost" className="p-0 h-auto">View case studies<span className="ml-2">→</span></Button></Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-primary mb-8">We Specialize In</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                "Kitchen Cabinets",
                "Wardrobes",
                "Walk-in Closets",
                "Bathroom Lavatories",
                "Toilet Partitions",
                "Bespoke Furniture",
              ].map((specialty, index) => (
                <motion.div
                  key={specialty}
                  className="bg-background/80 backdrop-blur-sm border border-accent/20 rounded-lg p-4 hover:border-accent/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-accent font-medium">{specialty}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="testimonials-title" role="region" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 id="testimonials-title" className="text-3xl md:text-4xl font-bold text-foreground mb-3">What clients say</h2>
            <p className="text-muted-foreground">Results backed by craftsmanship and service.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ q: "The installation was flawless and on time.", n: "Project Manager" }, { q: "Design to delivery exceeded expectations.", n: "Home Owner" }, { q: "Precision fabrication made the difference.", n: "Architect" }].map((t, i) => (
              <motion.blockquote key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative bg-card p-8 rounded-xl border border-border/60">
                <Quote className="absolute -top-3 left-6 w-6 h-6 text-primary" />
                <p className="text-muted-foreground mb-6 leading-relaxed">“{t.q}”</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{t.n}</span>
                  <div className="flex items-center gap-1 text-primary"><Star /><Star /><Star /><Star /><Star className="opacity-50" /></div>
                </div>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to start your cabinetry project?</h3>
          <p className="text-muted-foreground mb-8">Talk to our team about timelines, materials, and budgets.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact"><Button size="lg">Get Free Quote<span className="ml-2">→</span></Button></Link>
            <Link href="/projects"><Button size="lg" variant="outline">View Projects<span className="ml-2">→</span></Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
