"use client"

import Link from "next/link"
import { SidePanelNavigationEnhanced, type NavSection } from "@/components/side-panel-navigation-enhanced"

export function AdminSidePanel() {
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
      title: "TOOLS",
      items: [
        { title: "Calculator Pricing", href: "/admin/calculator-pricing", iconName: "calculator" },
        { title: "Fabricators", href: "/admin/fabricators", iconName: "wrench" },
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
      ],
    },
  ]

  return (
    <SidePanelNavigationEnhanced
      brandName="ModuLux Admin"
      brandInitial="A"
      breadcrumbItems={["Dashboard", "Admin"]}
      navigation={navigation}
      utility={utility}
    />
  )
}
