"use client"
import * as React from "react"
import Link from "next/link"
import { SidePanelNavigationEnhanced, type NavSection } from "@/components/side-panel-navigation-enhanced"
import { useEffect, useState } from "react"

export function AdminSidePanel(): JSX.Element {
  const [profile, setProfile] = useState<{ name?: string; role?: string; email?: string; avatar_url?: string; initials?: string } | null>(null)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/admin/profile", { method: "GET" })
        const data = await res.json().catch(() => ({}))
        if (mounted && data?.ok && data?.profile) setProfile(data.profile)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])
  const navigation: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [{ title: "Dashboard", href: "/admin", iconName: "dashboard" }],
    },
    {
      title: "CONTENT",
      items: [
        { title: "Projects", href: "/admin/projects", iconName: "folder" },
        { title: "Blog", href: "/admin/blog", iconName: "file" },
        { title: "Products", href: "/admin/products", iconName: "package" },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { title: "Inquiries", href: "/admin/inquiries", iconName: "mail" },
        { title: "Email", href: "/admin/email", iconName: "mail" },
        { title: "Social Planner", href: "/admin/social", iconName: "calendar" },
        { title: "Conversations", href: "/admin/conversations", iconName: "message" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { title: "CRM", href: "/admin/crm", iconName: "users" },
        { title: "Project Management", href: "/admin/project-management", iconName: "chart" },
      ],
    },
    {
      title: "TOOLS",
      items: [
        { title: "Calculator Pricing", href: "/admin/calculator-pricing", iconName: "calculator" },
        { title: "Fabricators", href: "/admin/fabricators", iconName: "wrench" },
        { title: "Proposal Creator", href: "/admin/proposals", iconName: "file" },
      ],
    },
  ]

  const utility = [
    { title: "Settings", href: "/admin/settings", iconName: "settings" },
    { title: "Help", href: "/admin/help", iconName: "help" },
    {
      title: "Business Roadmap",
      href: "/roadmap",
      iconName: "file",
      children: [
        { title: "Business Proposal", href: "/proposal", iconName: "file" },
        { title: "Pitch Deck", href: "/pitch-deck", iconName: "file" },
        { title: "Business Process", href: "/business-process", iconName: "file" },
      ],
    },
  ]

  return (
    <SidePanelNavigationEnhanced
      brandName={String(profile?.name || "Admin")}
      brandInitial={String(profile?.initials || "A")}
      userName={String(profile?.name || "John Doe")}
      userRole={String(profile?.role || "Administrator")}
      userInitials={String(profile?.initials || "JD")}
      userAvatarUrl={String(profile?.avatar_url || "")}
      breadcrumbItems={["Dashboard", "Admin"]}
      navigation={navigation}
      utility={utility}
      showScrollIndicators={true}
    />
  )
}
