"use client"
import { useEffect } from "react"
import { toast } from "sonner"

export function ToastOnParam({ param, value, message }: { param: string; value: string; message: string }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get(param) === value) {
      toast.success(message)
    }
  }, [param, value, message])
  return null
}