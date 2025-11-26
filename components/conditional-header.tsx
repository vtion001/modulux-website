"use client"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"

export function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin") || pathname === "/proposal" || pathname?.startsWith("/proposal/") || pathname === "/pitch-deck" || pathname?.startsWith("/pitch-deck/")) return null
  return <Header />
}