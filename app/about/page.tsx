"use client"

import { motion } from "framer-motion"
import { Award, Users, Globe, Calendar, Quote, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function AboutPage() {
  const stats = [
    { value: 10, suffix: "+", label: "Years of Combined Experience", icon: <Calendar className="w-6 h-6" /> },
    { value: 300, suffix: "+", label: "Projects Completed", icon: <Award className="w-6 h-6" /> },
    { value: 10, suffix: "+", label: "Skilled Craftsmen", icon: <Users className="w-6 h-6" /> },
    { value: 3, suffix: "", label: "Locations Served", icon: <Globe className="w-6 h-6" /> },
  ]

  function Counter({ to, duration = 1.2 }: { to: number; duration?: number }) {
    const [value, setValue] = useState(0)
    useEffect(() => {
      let raf: number
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / (duration * 1000))
        setValue(Math.floor(t * to))
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, [to, duration])
    return <>{value}</>
  }

  return (
    <main className="min-h-screen bg-background">
      <section aria-labelledby="about-title" role="region" className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
            <h1 id="about-title" className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">About ModuLux</h1>
            <p className="text-xl text-muted-foreground text-pretty mb-8">Your Vision, Built with Precision</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="#story"><Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Our Story<span className="ml-2">→</span></Button></Link>
              <Link href="/projects"><Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">View Projects<span className="ml-2">→</span></Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="story" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Our Story</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Founded as ModuLux has been at the forefront of premium modular cabinet manufacturing in Bulacan for over 10 years of combined experience. What started as a small workshop has grown into the region's most trusted name in custom cabinetry and furniture solutions.
              </p>
              <p className="text-lg text-muted-foreground text-pretty">
                Our commitment to exceptional craftsmanship, innovative design, and customer satisfaction has made us
                the preferred choice for homeowners, architects, and interior designers throughout the Philippines.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"><span className="size-2 rounded-full bg-primary mr-2" />Bespoke Craft</span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"><span className="size-2 rounded-full bg-emerald-500 mr-2" />Sustainable Materials</span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"><span className="size-2 rounded-full bg-blue-500 mr-2" />Turnkey Delivery</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <img src="/modern-luxury-kitchen-with-emerald-green-modular-c.png" alt="ModuLux Workshop" loading="lazy" decoding="async" className="w-full h-96 object-cover rounded-2xl shadow-lg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent rounded-2xl" />
              <div className="absolute bottom-4 left-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs text-foreground">Workshop</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section aria-labelledby="mission-title" role="region" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h3 id="mission-title" className="text-3xl font-bold text-foreground mb-6">Our Mission</h3>
              <p className="text-lg text-muted-foreground text-pretty">
                To design, manufacture, and deliver high-quality modular cabinets that meet the diverse needs and
                preferences of our customers, while promoting sustainable practices and contributing to the growth of
                the local economy.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <h3 className="text-3xl font-bold text-foreground mb-6">Our Vision</h3>
              <p className="text-lg text-muted-foreground text-pretty">
                To be the leading provider of innovative and sustainable modular cabinet solutions in the Philippines,
                recognized for our quality, craftsmanship, and customer satisfaction.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section aria-labelledby="achievements-title" role="region" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 id="achievements-title" className="text-4xl font-bold text-foreground mb-6 text-balance">Our Achievements</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Numbers that reflect our commitment to excellence
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 text-accent rounded-full mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-foreground mb-2"><Counter to={stat.value} />{stat.suffix}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" role="region" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 id="values-title" className="text-4xl font-bold text-foreground mb-6 text-balance">Our Core Values</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Customer Focus",
                description:
                  "We prioritize our customers' needs and strive to exceed their expectations in every interaction.",
              },
              {
                title: "Quality",
                description:
                  "We are committed to delivering products and services that meet the highest standards of quality and durability.",
              },
              {
                title: "Innovation",
                description:
                  "We embrace creativity and continuously seek new ways to improve our products, processes, and services.",
              },
              {
                title: "Sustainability",
                description:
                  "We are dedicated to promoting environmentally responsible practices and minimizing our impact on the planet.",
              },
              {
                title: "Integrity",
                description: "We conduct our business with honesty, transparency, and ethical behavior.",
              },
              {
                title: "Teamwork",
                description:
                  "We foster a collaborative and supportive work environment where every team member is valued and respected.",
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-pretty">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-testimonials" role="region" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 id="about-testimonials" className="text-4xl font-bold text-foreground mb-6 text-balance">Testimonials</h2>
            <p className="text-xl text-muted-foreground text-pretty">Trusted by homeowners and professionals across the Philippines.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ q: "Attention to detail and timely delivery.", n: "Project Manager" }, { q: "Design and build quality are exceptional.", n: "Home Owner" }, { q: "Reliable partner for complex cabinetry projects.", n: "Architect" }].map((t, i) => (
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

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to work with ModuLux?</h3>
          <p className="text-muted-foreground mb-8">Discuss materials, timelines, and budgets with our team.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact"><Button size="lg">Get Free Quote<span className="ml-2">→</span></Button></Link>
            <Link href="/projects"><Button size="lg" variant="outline">View Projects<span className="ml-2">→</span></Button></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
