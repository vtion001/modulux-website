"use client"
import * as React from "react"

export function SaveForm({ action, children, className }: { action?: any; children: React.ReactNode; className?: string }) {
  return (
    <form action={action as any} className={className}>{children}</form>
  )
}

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" className={className}>{children}</button>
  )
}