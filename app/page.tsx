"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { projects } from "@/lib/projects-data"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section aria-labelledby="hero-title" role="banner" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline preload="metadata" poster="/placeholder.svg" className="absolute inset-0 w-full h-full object-cover opacity-30">
          <source
            src="https://res.cloudinary.com/dbviya1rj/video/upload/v1757002878/v4veuczqvimciwmg2lfc.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 hero-gradient opacity-50"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">SLEEK & LUXURY</div>

          <h1 id="hero-title" className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance animate-in">
            Custom European Kitchen Cabinets
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty slide-in-from-bottom-2">
            Get a modern kitchen cabinet design you will love for a life.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button aria-label="Get in touch" size="lg" className="px-8 py-6 text-lg transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                Get In Touch
                <span className="ml-2">→</span>
              </Button>
            </Link>
            <Link href="/catalog">
              <Button aria-label="Get catalog" variant="outline" size="lg" className="px-8 py-6 text-lg bg-transparent transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                Get Catalog
                <span className="ml-2">↓</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 01 - Our Products */}
      <section
        aria-labelledby="products-title"
        role="region"
        className="relative py-24 bg-card overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">01</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 id="products-title" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Our Products</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                ModuLux provides turnkey European-style custom solutions: kitchen cabinets, wardrobes, bathroom vanities,
                interior doors, aluminum doors and windows, and bespoke furniture.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { name: "Kitchen Cabinets", href: "/products" },
                  { name: "Wardrobes", href: "/products" },
                  { name: "Bathroom Vanities", href: "/products" },
                  { name: "Interior Doors", href: "/products" },
                  { name: "Aluminum Doors & Windows", href: "/products" },
                  { name: "Bespoke Furniture", href: "/products" },
                ].map((product, index) => (
                  <Link key={index} href={product.href} aria-label={`Browse ${product.name}`}>
                    <div className="group relative rounded-xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px] focus-within:shadow-md">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                      <div className="relative flex items-center justify-between">
                        <span className="text-foreground font-medium group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="ml-2 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">View</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                    Browse Products
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                    Get a Free Quote
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative group rounded-2xl overflow-hidden">
              <img
                src="/luxury-kitchen-with-emerald-green-modular-cabinets.png"
                alt="ModuLux premium kitchen cabinetry"
                loading="lazy"
                decoding="async"
                className="w-full h-[520px] object-cover rounded-2xl will-change-transform transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs">European Minimalism</span>
                  <span className="inline-flex items-center rounded-full bg-white/70 text-foreground/80 px-3 py-1 text-xs">Precision Craft</span>
                </div>
                <Link href="/products" aria-label="Explore all products">
                  <Button variant="outline" size="sm" className="backdrop-blur-sm">
                    Explore
                    <span className="ml-1">→</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 - About Us */}
      <section
        aria-labelledby="about-title"
        role="region"
        className="relative py-24 bg-background overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">02</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative group rounded-2xl overflow-hidden">
              <img
                src="/elegant-living-room-with-built-in-emerald-green-mo.png"
                alt="About ModuLux Cabinet Manufacturing"
                loading="lazy"
                decoding="async"
                className="w-full h-[520px] object-cover rounded-2xl will-change-transform transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs">Premium Craft</span>
                  <span className="inline-flex items-center rounded-full bg-white/70 text-foreground/80 px-3 py-1 text-xs">Sustainable Materials</span>
                </div>
                <Link href="/projects" aria-label="View projects">
                  <Button variant="outline" size="sm" className="backdrop-blur-sm">
                    View Projects
                    <span className="ml-1">→</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <h2 id="about-title" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">About Us</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ModuLux delivers minimalist European aesthetics with high functionality and modern engineering. We design
                and build custom cabinetry that elevates everyday living through precision, sustainability, and timeless design.
              </p>

              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 text-center transition-shadow duration-300 hover:shadow-md focus-within:shadow-md">
                  <div className="text-4xl font-bold text-primary">10+</div>
                  <div className="mt-2 text-sm text-muted-foreground">Years of Combined Experience</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 text-center transition-shadow duration-300 hover:shadow-md focus-within:shadow-md">
                  <div className="text-4xl font-bold text-primary">300+</div>
                  <div className="mt-2 text-sm text-muted-foreground">Families Served</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3" aria-label="Highlights">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <span className="size-2 rounded-full bg-primary" /> Bespoke Designs
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <span className="size-2 rounded-full bg-emerald-500" /> Eco-Conscious Production
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                  <span className="size-2 rounded-full bg-blue-500" /> Turnkey Solutions
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/about">
                  <Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                    Know More
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                    Get a Free Quote
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03 - Our Projects */}
      <section aria-labelledby="projects-title" role="region" className="relative py-24 bg-card overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">03</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 id="projects-title" className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">Our Projects</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Over 300 custom cabinetry projects delivered nationwide.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {projects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/projects`} aria-label={project.title} className="group">
                <article className="cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/80 text-foreground/80 px-3 py-1 text-xs">{project.location}</span>
                        <span className="inline-flex items-center rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-xs">Cabinetry</span>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-white/80 text-foreground px-2 py-1 text-xs">View<span className="ml-1">→</span></span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
                    <p className="text-muted-foreground text-sm">{project.location}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/projects">
              <Button size="lg" className="transition-transform duration-200 ease-out hover:-translate-y-[1px]">
                Browse Projects
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 04 - Our Advantages */}
      <section aria-labelledby="advantages-title" role="region" className="relative py-24 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">04</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 id="advantages-title" className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">Our Advantages</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">ModuLux leads in quality, safety, and end-to-end delivery for custom cabinetry.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Custom Design", description: "9 materials, 100+ styles, 200+ colors. Engineered for ergonomics and space." },
              { title: "No Worry Delivery", description: "Door-to-door logistics with seamless coordination and one-stop service." },
              { title: "Quality & Safety Warranty", description: "European standards. Certified panels, coatings, and adhesives." },
              { title: "Easy Installation", description: "Pre-assembled packages, extra spares, step-by-step video guidance." },
            ].map((advantage, index) => (
              <div key={index} className="group relative rounded-xl border border-border/60 bg-card/60 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px] focus-within:shadow-md">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-muted w-10 h-10">
                    <span className="text-sm">★</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{advantage.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{advantage.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
                    <span>Learn More</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 05 - Quality Suppliers */}
      <section aria-labelledby="suppliers-title" role="region" className="relative py-24 bg-card overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">05</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 id="suppliers-title" className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">Quality Suppliers</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">We partner with world-class brands to ensure premium hardware and materials.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 place-items-center">
            {[
              { name: "Blum", src: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763354436/es1g9cuvzsehcih0e0m6.png" },
              { name: "Hafele", src: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763354435/x12hvcg1kxzurinijtqw.png" },
              { name: "Hettich", src: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763354436/mdnln0msjwbbi91umhuj.png" },
              { name: "Salice", src: "https://res.cloudinary.com/dbviya1rj/image/upload/v1763354436/gh2nj24ohzszvsngedkv.png" },
            ].map((supplier) => (
              <div key={supplier.name} className="group text-center w-full">
                <div className="relative bg-muted rounded-xl p-6 h-24 w-full flex items-center justify-center transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]">
                  <div className="w-40 md:w-48 h-12 md:h-16 flex items-center justify-center">
                    <img
                      src={supplier.src}
                      alt={`${supplier.name} logo`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Section 06 - Testimonials */}
      <section aria-labelledby="testimonials-title" role="region" className="relative py-24 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-muted/30 blur-2xl" />
        </div>
        <div className="absolute top-8 left-8 section-number">06</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 id="testimonials-title" className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">What our clients say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "We are happy with the results. Your support and hard work are greatly appreciated. Looking forward to more successful projects.",
                name: "James Rossetto",
                title: "PROJECT MANAGER",
              },
              {
                quote:
                  "A warm, inviting yet clean look. The interior design really set it off and I fell in love with it.",
                name: "Roanne Boldery",
                title: "HOME OWNER",
              },
              {
                quote:
                  "Quality materials and workmanship. ModuLux is a great partner for home decoration.",
                name: "Mrs. Green",
                title: "HOME OWNER",
              },
            ].map((t, i) => (
              <blockquote key={i} className="relative bg-card p-8 rounded-xl border border-border/60 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]">
                <svg aria-hidden="true" className="absolute -top-3 left-6 h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V22h8v-8H6.83A3.83 3.83 0 0 1 10.66 10c0-2.21-1.79-4-3.49-4zm10 0A5.17 5.17 0 0 0 12 11.17V22h8v-8h-3.17A3.83 3.83 0 0 1 20.66 10c0-2.21-1.79-4-3.49-4z"/></svg>
                <p className="text-muted-foreground mb-6 leading-relaxed">“{t.quote}”</p>
                <footer className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">{t.title}</div>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span className="opacity-50">★</span>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
