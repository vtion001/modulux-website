"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Building, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Project = {
  id: string
  title: string
  location: string
  year: string
  type: string
  description: string
  image?: string
  images?: string[]
  services?: string[]
  client?: string
  details?: {
    duration?: string
    area?: string
    budget?: string
    materials?: string[]
  }
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [project, setProject] = useState<Project | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sanitizeSrc = (src: string) => {
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
    fetch(`/api/projects`)
      .then((r) => r.json())
      .then((list: Project[]) => {
        if (cancelled) return
        const p = Array.isArray(list) ? list.find((x) => x.id === params.id) : null
        if (p) {
          const imgs = [p.image, ...(Array.isArray(p.images) ? p.images : [])]
            .map((x) => sanitizeSrc(String(x || "")))
            .filter((x): x is string => !!x)
          setProject({ ...p, images: imgs.length ? imgs : ["/placeholder.svg"] })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (!loaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    )
  }

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
    const total = project.images?.length ?? 1
    setCurrentImageIndex((prev) => (prev + 1) % total)
  }

  const prevImage = () => {
    const total = project.images?.length ?? 1
    setCurrentImageIndex((prev) => (prev - 1 + total) % total)
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
                src={project.images?.[currentImageIndex] || "/placeholder.svg"}
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
                {(project.images || []).map((_, index) => (
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
              {(project.images || []).map((image, index) => (
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
                {project.client && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Client</h3>
                    <p className="text-muted-foreground">{project.client}</p>
                  </div>
                )}
                {project.details?.duration && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Duration</h3>
                    <p className="text-muted-foreground">{project.details?.duration}</p>
                  </div>
                )}
                {project.details?.area && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Area</h3>
                    <p className="text-muted-foreground">{project.details?.area}</p>
                  </div>
                )}
                {project.details?.budget && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Budget Range</h3>
                    <p className="text-muted-foreground">{project.details?.budget}</p>
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-8">Services Provided</h2>
              <div className="space-y-4 mb-8">
                {Array.isArray(project.services) && project.services.map((service, index) => (
                  <div key={service} className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-4" />
                    <span className="text-foreground">{service}</span>
                  </div>
                ))}
              </div>
              {Array.isArray(project.details?.materials) && project.details!.materials!.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Materials Used</h3>
                  <div className="space-y-2">
                    {project.details!.materials!.map((material) => (
                      <div key={material} className="flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-4" />
                        <span className="text-muted-foreground">{material}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
