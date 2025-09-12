"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export default function ContactPage() {
  const contactRef = useRef(null)
  const contactInView = useInView(contactRef, { once: true, margin: "-100px" })

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
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
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
                      placeholder="Tell us about your project..."
                      rows={4}
                      className="border-border focus:border-accent focus:ring-accent/20 transition-all duration-300"
                    />
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg rounded-lg transition-all duration-300 hover:shadow-2xl relative overflow-hidden group"
                    >
                      <span className="relative z-10">Get a Free Consultation</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-accent to-accent/80"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </motion.div>
                </form>

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
    </div>
  )
}
