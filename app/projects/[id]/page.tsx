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
            <div
              className="text-xl text-muted-foreground text-pretty whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: project.description
                  .split("\n")
                  .map((line) => {
                    // Headers: lines starting with #, ##, ###
                    if (line.match(/^###\s/)) return `<h3 class="text-2xl font-semibold text-foreground mt-6 mb-3">${line.replace(/^###\s/, "")}</h3>`;
                    if (line.match(/^##\s/)) return `<h2 class="text-3xl font-bold text-foreground mt-8 mb-4">${line.replace(/^##\s/, "")}</h2>`;
                    if (line.match(/^#\s/)) return `<h1 class="text-4xl font-extrabold text-foreground mt-10 mb-6">${line.replace(/^#\s/, "")}</h1>`;
                    // Bold: **text**
                    line = line.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-foreground'>$1</strong>");
                    // Line breaks: empty lines become <br/>
                    if (!line.trim()) return "<br/>";
                    return `<p>${line}</p>`;
                  })
                  .join(""),
              }}
            />
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

      {/* Services Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-foreground mb-8">Services Provided</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {Array.isArray(project.services) &&
                project.services.map((service) => (
                  <span
                    key={service}
                    className="px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-full"
                  >
                    {service}
                  </span>
                ))}
            </div>
          </motion.div>
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
