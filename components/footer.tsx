"use client"

import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.footer
      className="bg-primary text-primary-foreground py-8 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div className="mb-4 flex justify-center" whileHover={{ scale: 1.05 }}>
          <img
            src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
            alt="ModuLux Logo"
            className="h-12 w-auto"
          />
        </motion.div>
        <p className="text-primary-foreground/80 mb-4">Your Vision, Built with Precision</p>
        <p className="text-sm text-primary-foreground/60">© 2024 ModuLux. All rights reserved.</p>
      </div>
    </motion.footer>
  )
}
