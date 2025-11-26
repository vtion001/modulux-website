"use client"

import { useEffect, useState } from "react"

export function AdminQuickPanel() {
  const [openCalculator, setOpenCalculator] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpenCalculator(true)
    window.addEventListener("admin:open-calculator", onOpen as any)
    return () => window.removeEventListener("admin:open-calculator", onOpen as any)
  }, [])

  if (!openCalculator) return null

  return (
    <section className="mb-6 rounded-xl border bg-card/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Calculator</div>
        <button
          type="button"
          onClick={() => setOpenCalculator(false)}
          className="px-3 py-2 rounded-md border border-border/50 text-sm"
        >
          Close
        </button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <iframe title="Calculator" src="/calculator" className="w-full h-[70vh] bg-background" />
      </div>
    </section>
  )
}

