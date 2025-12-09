"use client"
import * as React from "react"
import { toast } from "sonner"
import { useFormStatus } from "react-dom"

function FormWatcher({ onSubmitted, successMessage }: any) {
  const { pending } = useFormStatus()
  const wasPending = React.useRef(false)
  const [saved, setSaved] = React.useState(false)
  React.useEffect(() => {
    if (pending) {
      wasPending.current = true
      setSaved(false)
    } else if (wasPending.current) {
      wasPending.current = false
      setSaved(true)
      if (typeof onSubmitted === "function") {
        try { onSubmitted() } catch {}
      } else if (typeof window !== "undefined") {
        try { window.dispatchEvent(new CustomEvent("modal:close")) } catch {}
      }
      try { if (successMessage) toast.success(String(successMessage)) } catch {}
    }
  }, [pending, onSubmitted, successMessage])
  return (
    <div className="text-xs text-muted-foreground mb-1">
      {pending ? "Saving..." : (saved ? "Saved" : null)}
    </div>
  )
}

export const SaveForm: any = ({ action, children, className, onSubmitted, successMessage }: any) => {
  return (
    <form action={action as any} className={className}>
      <FormWatcher onSubmitted={onSubmitted} successMessage={successMessage} />
      {children}
    </form>
  )
}

export const SubmitButton: any = ({ children, className, confirm }: any) => {
  const onClick = (e: any) => {
    if (confirm && typeof window !== "undefined") {
      const ok = window.confirm(String(confirm))
      if (!ok) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }
  return (
    <button type="submit" className={className} onClick={onClick}>
      {children}
    </button>
  )
}
