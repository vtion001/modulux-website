"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FolderOpen,
  Package,
  ShoppingCart,
  User,
  CreditCard,
  FileText,
  Wallet,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Search,
  Bell,
  Sun,
  ChevronDown,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigationData: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        badge: "3",
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        children: [
          { title: "Traffic", href: "/analytics/traffic", icon: BarChart3 },
          { title: "Conversions", href: "/analytics/conversions", icon: BarChart3 },
        ],
      },
      {
        title: "Organization",
        href: "/organization",
        icon: Users,
        children: [
          { title: "Team", href: "/organization/team", icon: Users },
          { title: "Departments", href: "/organization/departments", icon: Users },
        ],
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
        badge: "12",
      },
    ],
  },
  {
    title: "E-COMMERCE",
    items: [
      {
        title: "Products",
        href: "/products",
        icon: Package,
        children: [
          { title: "All Products", href: "/products", icon: Package },
          { title: "Categories", href: "/products/categories", icon: Package },
          { title: "Inventory", href: "/products/inventory", icon: Package },
        ],
      },
      {
        title: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        badge: "5",
      },
      {
        title: "Customers",
        href: "/customers",
        icon: User,
        children: [
          { title: "All Customers", href: "/customers", icon: User },
          { title: "Segments", href: "/customers/segments", icon: User },
        ],
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        title: "Transactions",
        href: "/transactions",
        icon: CreditCard,
        children: [
          { title: "All Transactions", href: "/transactions", icon: CreditCard },
          { title: "Pending", href: "/transactions/pending", icon: CreditCard },
        ],
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: FileText,
        badge: "2",
      },
      {
        title: "Payments",
        href: "/payments",
        icon: Wallet,
        children: [
          { title: "Payment Methods", href: "/payments/methods", icon: Wallet },
          { title: "Payment History", href: "/payments/history", icon: Wallet },
        ],
      },
    ],
  },
]

const utilityItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
  },
]

export function SidePanelNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const toggleExpanded = (itemPath: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemPath)) {
        newSet.delete(itemPath)
      } else {
        newSet.add(itemPath)
      }
      return newSet
    })
  }

  const isItemActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/")
  }

  const NavItemComponent = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.href)
    const isActive = isItemActive(item.href)

    return (
      <div className="w-full">
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
            "hover:bg-gray-100/50",
            isActive
              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
              : "text-gray-700 hover:text-gray-900",
            depth > 0 && "ml-8 text-xs"
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault()
              toggleExpanded(item.href)
            }
          }}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-haspopup={hasChildren ? "menu" : undefined}
          aria-current={isActive ? "page" : undefined}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </div>
        </Link>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NavSectionComponent = ({ section }: { section: NavSection }) => (
    <div className="py-4">
      <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {section.title}
      </h3>
      <div className="space-y-1">
        {section.items.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 md:hidden"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="side-panel-navigation"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-gray-700" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side Panel */}
      <nav
        id="side-panel-navigation"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gray-900">ModuLux</span>
          </Link>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Navigation Content */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {navigationData.map((section) => (
              <NavSectionComponent key={section.title} section={section} />
            ))}
            
            <Separator className="my-4" />
            
            {/* Utility Items */}
            <div className="py-2">
              {utilityItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-4 md:pl-72">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 md:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-gray-900">Dashboard</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">CMS</span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4" />
            </button>
            
            <button
              className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Spacer */}
      <div className="pt-16 md:pl-64" />
    </>
  )
}