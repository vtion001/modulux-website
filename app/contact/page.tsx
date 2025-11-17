"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Info, Phone, Mail, Clock, Check, ArrowRight } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

export default function ContactPage() {
  const contactRef = useRef(null)
  const contactInView = useInView(contactRef, { once: true, margin: "-100px" })
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Contact Section */}
      <section className="py-20 bg-background" ref={contactRef}>
        <div className="container mx-auto px-4">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center text-primary mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={contactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            Contact Us
          </motion.h1>

          <motion.p
            className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={contactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Get In Touch
          </motion.p>

          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={contactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-start gap-3 p-4 border border-border/50 rounded-lg bg-background">
                    <Info className="w-5 h-5 text-accent mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium text-foreground mb-1">How to get a quote</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Attach an architectural plan or clear photos of the area</li>
                        <li>Include key measurements (length, width, height)</li>
                        <li>Optionally add material/finish preferences and location</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://res.cloudinary.com/dbviya1rj/image/upload/v1763251599/jqcxpbnwpvfuvpcippln.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src="https://res.cloudinary.com/dbviya1rj/image/upload/v1763251599/jqcxpbnwpvfuvpcippln.jpg"
                        alt="Example plan with measurements for quoting"
                        className="w-full max-h-[320px] object-contain rounded-lg border border-border/50"
                      />
                    </a>
                    <div className="text-xs text-muted-foreground mt-2">Example reference of area and measurements</div>
                  </div>
                </div>
                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    setPending(true)
                    setStatus(null)
                    const formEl = e.currentTarget as HTMLFormElement
                    const fd = new FormData(formEl)
                    const res = await fetch("/api/inquiries", { method: "POST", body: fd })
                    const data = await res.json()
                    setStatus({ ok: !!data?.ok, message: data?.ok ? "Inquiry submitted" : data?.error || "Submission failed" })
                    if (data?.ok) formEl.reset()
                  } catch (err: any) {
                    setStatus({ ok: false, message: err?.message || "Submission failed" })
                  } finally {
                    setPending(false)
                  }
                }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your full name"
                        className="border-border focus:border-accent focus:ring-accent/20 transition-all duration-300"
                      />
                    </motion.div>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="border-border focus:border-accent focus:ring-accent/20 transition-all duration-300"
                      />
                    </motion.div>
                  </div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Your phone number"
                      className="border-border focus:border-accent focus:ring-accent/20 transition-all duration-300"
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your project..."
                      rows={4}
                      className="border-border focus:border-accent focus:ring-accent/20 transition-all duration-300"
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label htmlFor="attachments" className="block text-sm font-medium text-foreground mb-2">
                      Attachments
                    </label>
                    <input
                      id="attachments"
                      name="attachments"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,application/pdf"
                      className="w-full rounded-md border border-border px-3 py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Supported: PDF, JPEG, PNG</p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg rounded-lg transition-all duration-300 hover:shadow-2xl relative overflow-hidden group"
                    >
                      <span className="relative z-10">{pending ? "Submitting..." : "Get a Free Consultation"}</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-accent to-accent/80"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </motion.div>
                </form>

                {status && (
                  <div className={`mt-4 text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>{status.message}</div>
                )}

                <div className="mt-8 pt-8 border-t border-border text-center">
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    We are located in Bulacan and serve all of the Philippines.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="rounded-xl border border-border/50 bg-card/60 p-6">
              <div className="text-lg font-semibold mb-3">Why Choose ModuLux</div>
              <div className="space-y-3">
                {[
                  "Premium materials and craftsmanship",
                  "Tailored designs for your space",
                  "Professional installation and aftercare",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="text-sm text-muted-foreground">{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 p-6">
              <div className="text-lg font-semibold mb-3">Contact Details</div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><a href="tel:+639566549968" className="hover:text-primary">+63 956 654 9968</a></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href="mailto:admin@modulux.local" className="hover:text-primary">admin@modulux.local</a></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Mon–Sat, 9:00 AM – 6:00 PM</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />Bulacan, Philippines</div>
              </div>
              <a href="/projects" className="mt-4 inline-flex items-center gap-2 text-primary text-sm">
                View Projects <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 p-6">
              <div className="text-lg font-semibold mb-3">Our Promise</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">48h</div>
                  <div className="text-xs text-muted-foreground">Quote Turnaround</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10yr</div>
                  <div className="text-xs text-muted-foreground">Warranty Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">150+</div>
                  <div className="text-xs text-muted-foreground">Projects Completed</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
