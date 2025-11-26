"use client"

import { useEffect, useState } from "react"

export function CalculatorOverlayTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left"
      >
        Calculator
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-4 sm:inset-8 bg-background border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold">Calculator</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md border border-border/50 text-sm"
              >
                Close
              </button>
            </div>
            <iframe
              title="Calculator"
              src="/calculator"
              className="w-full h-[calc(100%-52px)] bg-background"
            />
          </div>
        </div>
      )}
    </>
  )
}

