"use client"
import { useEffect, useRef } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"

export function SaveForm({ action, children }: { action: (prevState: any, formData: FormData) => Promise<{ ok: boolean; message?: string }>; children: React.ReactNode }) {
  const [state, formAction] = useFormState(action, { ok: false, message: "" })
  const prevOk = useRef(false)
  useEffect(() => {
    if (state?.ok && !prevOk.current) {
      toast.success(state.message || "Changes saved")
      prevOk.current = true
      setTimeout(() => {
        prevOk.current = false
      }, 1000)
    }
  }, [state])
  return <form action={formAction} className="space-y-3 bg-card border border-border rounded-xl p-6">{children}</form>
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending} className="w-full bg-primary text-white py-2 rounded-md transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] disabled:opacity-50">
      {children}
    </button>
  )
}