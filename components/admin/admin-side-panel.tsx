"use client"
import * as React from "react"
import Link from "next/link"
import { SidePanelNavigationEnhanced, type NavSection } from "@/components/side-panel-navigation-enhanced"

export function AdminSidePanel(): JSX.Element {
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
      showScrollIndicators={true}
    />
  )
}
