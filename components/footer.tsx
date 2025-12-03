"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react"
import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()
  if (pathname === "/proposal" || pathname?.startsWith("/proposal/") || pathname === "/pitch-deck" || pathname?.startsWith("/pitch-deck/")) return null
  return (
    <motion.footer
      className="bg-background text-foreground border-t border-border relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.05) 50%, transparent 60%)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="py-12 grid gap-10 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <motion.div whileHover={{ scale: 1.03 }} className="flex items-center">
              <img
                src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
                alt="ModuLux logo"
                loading="lazy"
                decoding="async"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </motion.div>
            <p className="text-muted-foreground">Your Vision, Built with Precision</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 lg:col-span-2">
            <div>
              <div className="text-sm font-semibold mb-3">Navigation</div>
              <ul className="space-y-2 text-sm">
                <li><Link aria-label="About" href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link aria-label="Products" href="/products" className="hover:text-primary transition-colors">Products</Link></li>
                <li><Link aria-label="Projects" href="/projects" className="hover:text-primary transition-colors">Projects</Link></li>
                <li><Link aria-label="Catalog" href="/catalog" className="hover:text-primary transition-colors">Catalog</Link></li>
                <li><Link aria-label="Contact" href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-3">Contact</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href="mailto:info@modulux.design" className="hover:text-primary transition-colors">sales@modulux.ph</a></li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /><a href="tel:+639000000000" className="hover:text-primary transition-colors">(02) 7119-4130</a></li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>161 Kamias Road, Sikatuna Village, Quezon City, Philippines</span></li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <a aria-label="Facebook" href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-md border hover:bg-muted transition-colors"><Facebook className="w-4 h-4" /></a>
                <a aria-label="Instagram" href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-md border hover:bg-muted transition-colors"><Instagram className="w-4 h-4" /></a>
                <a aria-label="LinkedIn" href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-md border hover:bg-muted transition-colors"><Linkedin className="w-4 h-4" /></a>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>

        <div className="border-t border-border/60 py-6 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-muted-foreground">© {new Date().getFullYear()} ModuLux. All rights reserved.</div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
