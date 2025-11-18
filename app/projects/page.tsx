"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProjects(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function sanitizeSrc(src: string) {
    const s = (src || "").trim()
    if (!s) return ""
    const trimToFirstExt = (u: string) => {
      const re = /(\.jpe?g|\.png|\.webp|\.gif)/i
      const m = re.exec(u)
      if (!m) return u
      return u.slice(0, m.index + m[0].length)
    }
    if (s.startsWith("http")) return trimToFirstExt(s)
    if (s.startsWith("/")) {
      if (s.includes("http")) {
        const i = s.indexOf("http")
        return trimToFirstExt(s.slice(i))
      }
      return trimToFirstExt(s)
    }
    if (s.includes("http")) {
      const i = s.indexOf("http")
      return trimToFirstExt(s.slice(i))
    }
    return ""
  }

  function pickImage(p: any) {
    const candidates = [p?.image, ...(Array.isArray(p?.images) ? p.images : [])].filter(Boolean)
    for (const c of candidates) {
      const s = sanitizeSrc(String(c))
      if (s) return s
    }
    return "/placeholder.svg"
  }

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
      {/* Hero Section */}
      <section aria-labelledby="projects-title" role="region" className="relative py-24 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 id="projects-title" className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Our Projects</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Discover our portfolio of exceptional modular cabinet installations across Palawan and beyond
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="#projects-grid"><Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Browse Projects<span className="ml-2">→</span></Button></Link>
              <Link href="/contact"><Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">Get a Free Quote<span className="ml-2">→</span></Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects-grid" className="py-20">
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
                        src={pickImage(project)}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      <section aria-labelledby="stats-title" role="region" className="relative py-20 bg-primary/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(500px circle at 10% 90%, rgba(16,185,129,.08) 0%, transparent 60%)" }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 id="stats-title" className="text-4xl font-bold text-foreground mb-6 text-balance">Project Statistics</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Our commitment to excellence reflected in numbers
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 300, suffix: "+", label: "Projects Completed", icon: <Calendar className="w-8 h-8" /> },
              { value: 300, suffix: "+", label: "Happy Clients", icon: <Users className="w-8 h-8" /> },
              { value: 10, suffix: "+", label: "Years of Combined Excellence", icon: <MapPin className="w-8 h-8" /> },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center bg-card border border-border rounded-xl p-8 hover:shadow-md transition-all"
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
    </main>
  )
}
