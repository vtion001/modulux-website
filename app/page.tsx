"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
          <source
            src="https://res.cloudinary.com/dbviya1rj/video/upload/v1757002878/v4veuczqvimciwmg2lfc.mp4"
            type="video/mp4"
          />
        </video>

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 hero-gradient opacity-60"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">SLEEK & LUXURY</div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">
            Custom European Kitchen Cabinets
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty">
            Get a modern kitchen cabinet design you will love for a life.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="px-8 py-6 text-lg">
                Get In Touch
                <span className="ml-2">→</span>
              </Button>
            </Link>
            <Link href="/catalog">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg bg-transparent">
                Get Catalog
                <span className="ml-2">↓</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 01 - Our Products */}
      <section className="py-24 bg-card relative">
        <div className="absolute top-8 left-8 section-number">01</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Products</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                ModuLux, as a professional cabinet manufacturer, provides one-stop solution for European style custom
                kitchen cabinets, wardrobes, bathroom vanities, interior doors and built-ins for any room.
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
                  <Link key={index} href={product.href}>
                    <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer group">
                      <span className="text-foreground group-hover:text-primary transition-colors">{product.name}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link href="/products">
                <Button variant="outline" size="lg">
                  Browse Products
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img
                src="/luxury-kitchen-with-emerald-green-modular-cabinets.png"
                alt="Custom kitchen cabinet manufacturer"
                className="w-full h-[500px] object-cover rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 - About Us */}
      <section className="py-24 bg-background relative">
        <div className="absolute top-8 left-8 section-number">02</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src="/elegant-living-room-with-built-in-emerald-green-mo.png"
                alt="About ModuLux Cabinet Manufacturing"
                className="w-full h-[500px] object-cover rounded-lg shadow-2xl"
              />
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">About Us</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                ModuLux, a high-end custom kitchen cabinet manufacturer, is committed to providing minimalist European
                style custom home furnishing products that are highly functional and modern. With the mission of
                fulfilling people's aspiration for a better home, ModuLux strives to provide best one-stop solutions and
                turnkey furnishing solutions of whole house customization.
              </p>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">10+</div>
                  <div className="text-sm text-muted-foreground">Years of Combined Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">300+</div>
                  <div className="text-sm text-muted-foreground">Families Served</div>
                </div>
              </div>

              <Link href="/about">
                <Button size="lg">
                  Know More
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03 - Our Projects */}
      <section className="py-24 bg-card relative">
        <div className="absolute top-8 left-8 section-number">03</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Projects</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              As a trustworthy kitchen cabinet manufacturer, ModuLux have supplied custom cabinetry for over 300
              projects nationwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: "Modern Custom Built Home Project in Oakville, Canada",
                location: "Oakville, Canada",
                image: "/luxury-home-office-with-emerald-green-modular-cabi.png",
              },
              {
                title: "Luxury Home Project in NJ, USA",
                location: "New Jersey, USA",
                image: "/panoramic-view-of-luxury-kitchen-and-dining-area-w.png",
              },
              {
                title: "Contemporary House Project in Oman",
                location: "Muscat, Oman",
                image: "/luxury-bedroom-with-emerald-green-modular-wardrobe.png",
              },
              {
                title: "America Kitchen Bathroom Project in Sun Valley, Los Angeles",
                location: "Los Angeles, USA",
                image: "/modern-luxury-kitchen-with-emerald-green-modular-c.png",
              },
              {
                title: "Glossy Grey Whole House Project in Perth, Australia",
                location: "Perth, Australia",
                image: "/luxury-kitchen-with-emerald-green-modular-cabinets.png",
              },
              {
                title: "Custom Full House Furnishing Project in Ghana",
                location: "Accra, Ghana",
                image: "/elegant-living-room-with-built-in-emerald-green-mo.png",
              },
            ].map((project, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{project.title}</h3>
                <p className="text-muted-foreground text-sm">{project.location}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/projects">
              <Button variant="outline" size="lg">
                Browse Projects
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 04 - Our Advantages */}
      <section className="py-24 bg-background relative">
        <div className="absolute top-8 left-8 section-number">04</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Advantages</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ModuLux, as a trusted cabinet manufacturer, leads the world in custom cabinets quality and offering a safe
              living environment for every customer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Custom Design",
                description: "9 door materials, 100+ styles, 200+ colors. Ergonomics and space utilization.",
              },
              {
                title: "No Worry Delivery",
                description: "Smooth systems, door to door delivery service. One-stop service.",
              },
              {
                title: "Quality & Safety Warranty",
                description: "European standard. Quality panels, paints, adhesives from top suppliers.",
              },
              {
                title: "Easy Installation",
                description: "Pre-assembly package, extra free spare materials. Video installation instruction.",
              },
            ].map((advantage, index) => (
              <div
                key={index}
                className="text-left p-6 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">{advantage.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 05 - Quality Suppliers */}
      <section className="py-24 bg-card relative">
        <div className="absolute top-8 left-8 section-number">05</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Quality Suppliers</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We partner with world-class suppliers to ensure the highest quality materials and components for your
              custom cabinets.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {["BLUM", "HAFELE", "HETTICH", "GRASS", "SALICE", "ACCURIDE"].map((supplier, index) => (
              <div key={index} className="text-center">
                <div className="bg-muted rounded-lg p-6 h-20 flex items-center justify-center">
                  <span className="font-bold text-lg text-muted-foreground">{supplier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dealership CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Become our dealer to get dealer price for full house products.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dealership">
              <Button variant="secondary" size="lg" className="px-8 py-6 text-lg">
                Dealership
                <span className="ml-2">→</span>
              </Button>
            </Link>
            <Link href="/catalog">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Get Catalog
                <span className="ml-2">↓</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 06 - Testimonials */}
      <section className="py-24 bg-background relative">
        <div className="absolute top-8 left-8 section-number">06</div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">What our clients say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "I would like to share some modern kitchen cabinets photos for the project. It is the first project, generally speaking we are happy with the results. All your supports & hard works are greatly appreciated. I look forward to other successful projects.",
                name: "James Rossetto",
                title: "PROJECT MANAGER",
              },
              {
                quote:
                  "A modern kitchen cabinet design and beautiful home caught my eye, style for a warm, inviting yet a clean, uncluttered look, outside the villa is modern weatherboard and indoors is a sleek finish, but it was the interior design that really set it off, I fell in love with it.",
                name: "Roanne Boldery",
                title: "HOME OWNER",
              },
              {
                quote:
                  "I'm satisfied with the quality of materials, workmanship, and modern kitchen cabinets and other furniture of my home built by ModuLux. A great kitchen cabinet manufacturer for home decoration!",
                name: "Mrs. Green",
                title: "HOME OWNER",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-card p-8 rounded-lg border border-border">
                <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">{testimonial.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
