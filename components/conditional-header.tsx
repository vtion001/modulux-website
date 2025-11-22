"use client"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"

export function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin") || pathname === "/proposal" || pathname?.startsWith("/proposal/")) return null
  return <Header />
}