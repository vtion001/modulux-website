"use client"
import { useState } from "react"

export function AddModal({ trigger, title, description, children }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
        {trigger}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 w-[95%] max-w-2xl">
            <div className="mb-4">
              <div className="text-lg font-semibold">{title}</div>
              {description && <div className="text-sm text-muted-foreground">{description}</div>}
            </div>
            <div className="space-y-3">{children}</div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md border">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}