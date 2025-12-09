"use client"
import * as React from "react"
import { useFormStatus } from "react-dom"

function FormWatcher({ onSubmitted }: any) {
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
    }
  }, [pending, onSubmitted])
  return (
    <div className="text-xs text-muted-foreground mb-1">
      {pending ? "Saving..." : (saved ? "Saved" : null)}
    </div>
  )
}

export const SaveForm: any = ({ action, children, className, onSubmitted }: any) => {
  return (
    <form action={action as any} className={className}>
      <FormWatcher onSubmitted={onSubmitted} />
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
