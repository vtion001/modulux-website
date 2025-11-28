"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, Fragment } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
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
  Mail,
  Menu,
  X,
  ChevronRight,
  Search,
  Bell,
  Sun,
  ChevronDown,
  MessageSquare,
  CalendarDays,
  Calculator,
  Wrench,
} from "lucide-react"
import "./side-panel-navigation.css"

export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
  iconName?: string
}

export interface NavSection {
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

export interface SidePanelNavigationEnhancedProps {
  navigation?: NavSection[]
  utility?: NavItem[]
  brandName?: string
  brandInitial?: string
  breadcrumbItems?: string[]
  rightActions?: React.ReactNode
}

export function SidePanelNavigationEnhanced({
  navigation,
  utility,
  brandName,
  brandInitial,
  breadcrumbItems,
  rightActions,
}: SidePanelNavigationEnhancedProps): JSX.Element {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  const navData = navigation ?? navigationData
  const utilData = utility ?? utilityItems
  const brandText = brandName ?? "ModuLux"
  const brandInitialText = brandInitial ?? "M"
  const crumbs = breadcrumbItems ?? ["Dashboard", "CMS"]

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    folder: FolderOpen,
    file: FileText,
    package: Package,
    mail: Mail,
    message: MessageSquare,
    calendar: CalendarDays,
    calculator: Calculator,
    wrench: Wrench,
    settings: Settings,
    help: HelpCircle,
    users: Users,
    chart: BarChart3,
    creditcard: CreditCard,
    wallet: Wallet,
    shoppingcart: ShoppingCart,
    user: User,
  }

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

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev)
  }

  const NavItemComponent = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.href)
    const isActive = isItemActive(item.href)
    const IconComp = item.icon ?? (item.iconName ? iconMap[item.iconName] : LayoutDashboard)

    return (
      <div className="w-full">
        <Link
          href={item.href}
          className={cn(
            "side-panel-nav-item",
            isActive && "active",
            depth > 0 && "side-panel-subnav-item"
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
          <div className="side-panel-nav-item-content">
            <IconComp className="side-panel-nav-item-icon" />
            <span className="side-panel-nav-item-text">{item.title}</span>
          </div>
          <div className="side-panel-nav-item-actions">
            {item.badge && (
              <span className="side-panel-badge">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "side-panel-chevron",
                  isExpanded && "expanded"
                )}
              />
            )}
          </div>
        </Link>

        {hasChildren && isExpanded && (
          <div className="side-panel-subnav">
            {item.children?.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NavSectionComponent = ({ section }: { section: NavSection }) => (
    <div className="side-panel-section">
      <h3 className="side-panel-section-title">
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
        onClick={handleToggleMenu}
        className="side-panel-mobile-button"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="side-panel-navigation"
      >
        {isOpen ? (
          <X className="side-panel-mobile-button-icon" />
        ) : (
          <Menu className="side-panel-mobile-button-icon" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="side-panel-overlay"
          onClick={handleToggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Side Panel */}
      <nav
        id="side-panel-navigation"
        className={cn(
          "side-panel-nav md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header Section */}
        <div className="side-panel-header">
          <Link href="/" className="side-panel-logo">
            <div className="side-panel-logo-icon">
              <span>{brandInitialText}</span>
            </div>
            <span>{brandText}</span>
          </Link>
          
          <button
            onClick={handleToggleMenu}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Section */}
        <div className="side-panel-search">
          <div className="relative">
            <Search className="side-panel-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="side-panel-search-input"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Navigation Content */}
        <ScrollArea className="side-panel-scroll-area">
          <div>
            {navData.map((section) => (
              <NavSectionComponent key={section.title} section={section} />
            ))}
            
            <Separator className="my-4" />
            
            {/* Utility Items */}
            <div className="side-panel-utility">
              {utilData.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div className="side-panel-user">
          <div className="side-panel-user-content">
            <div className="side-panel-user-avatar">
              <span>JD</span>
            </div>
            <div className="side-panel-user-info">
              <p className="side-panel-user-name">John Doe</p>
              <p className="side-panel-user-role">Administrator</p>
            </div>
            <button className="side-panel-user-chevron">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Top Header Bar */}
      <header className="side-panel-header-bar">
        <div className="side-panel-header-content">
          {/* Breadcrumb */}
          <div className="side-panel-breadcrumb">
            <button
              onClick={handleToggleMenu}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            {crumbs.length > 0 && (
              <span className="side-panel-breadcrumb-item">{crumbs[0]}</span>
            )}
            {crumbs.slice(1).map((c, i) => (
              <Fragment key={`crumb-frag-${i}`}>
                <span className="side-panel-breadcrumb-separator">/</span>
                <span>{c}</span>
              </Fragment>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="side-panel-header-actions">
            <button
              className="side-panel-header-button"
              aria-label="Toggle theme"
            >
              <Sun className="side-panel-header-button-icon" />
            </button>
            
            <button
              className="side-panel-header-button relative"
              aria-label="View notifications"
            >
              <Bell className="side-panel-header-button-icon" />
              <span className="side-panel-notification-badge">
                3
              </span>
            </button>
            
            <button
              className="side-panel-header-button"
              aria-label="Open settings"
            >
              <Settings className="side-panel-header-button-icon" />
            </button>
            {rightActions}
          </div>
        </div>
      </header>

      
    </>
  )
}
