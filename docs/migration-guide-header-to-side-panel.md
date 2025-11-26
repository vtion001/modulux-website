# Migration Guide: Header to Side Panel Navigation

## Overview

This guide provides step-by-step instructions for migrating from the current header navigation to the new side panel navigation system. The migration maintains all existing functionality while providing a modern, clean interface that matches the reference design.

## Pre-Migration Checklist

### 1. Backup Current Implementation
```bash
# Create a backup of current header files
cp components/header.tsx components/header-backup.tsx
cp components/conditional-header.tsx components/conditional-header-backup.tsx
```

### 2. Review Current Dependencies
Check your current header implementation for any:
- Custom styling
- Additional functionality
- Integration points
- Analytics tracking
- Custom event handlers

### 3. Test Current Functionality
Document all current header features:
- Navigation items and their behavior
- Mobile menu functionality
- Search functionality
- Language selector
- User authentication state
- Any custom CTAs or buttons

## Migration Steps

### Step 1: Install Required Dependencies

The side panel navigation requires these additional dependencies:

```bash
npm install lucide-react @radix-ui/react-scroll-area @radix-ui/react-separator
```

### Step 2: Import CSS Styles

Add the CSS file to your global styles or import it in the component:

```tsx
// In your app/layout.tsx or relevant layout file
import "@/components/side-panel-navigation.css"
```

### Step 3: Update Conditional Header Component

Replace the current `ConditionalHeader` component with the new side panel navigation:

```tsx
// components/conditional-header.tsx
"use client"
import { usePathname } from "next/navigation"
import { SidePanelNavigationEnhanced } from "@/components/side-panel-navigation-enhanced"

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Keep the same exclusion logic
  if (pathname?.startsWith("/admin") || 
      pathname === "/proposal" || 
      pathname?.startsWith("/proposal/") || 
      pathname === "/pitch-deck" || 
      pathname?.startsWith("/pitch-deck/")) {
    return null
  }
  
  return <SidePanelNavigationEnhanced />
}
```

### Step 4: Update Layout Structure

Modify your root layout to accommodate the side panel navigation:

```tsx
// app/layout.tsx
import { ConditionalHeader } from "@/components/conditional-header"
import { Footer } from "@/components/footer"
// ... other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth light" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <AccessibilitySkipLink />
          
          {/* Side Panel Navigation - handles its own layout */}
          <ConditionalHeader />
          
          {/* Main content area - now has proper spacing */}
          <main id="main-content" role="main" className="min-h-screen">
            <Breadcrumb />
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </main>
          
          <Footer />
          <FloatingContact />
          <LiveChat />
          <ScrollToTop />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Step 5: Update Page Components

Individual pages no longer need to worry about header spacing. The side panel navigation handles its own layout:

```tsx
// Example page component
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Your page content */}
      <h1 className="text-4xl font-bold">Welcome to ModuLux</h1>
      {/* ... rest of your content */}
    </div>
  )
}
```

### Step 6: Configure Navigation Data

Customize the navigation data in the side panel component to match your site's structure:

```tsx
// components/side-panel-navigation-enhanced.tsx

// Update navigationData to match your site's pages
const navigationData: NavSection[] = [
  {
    title: "MAIN",
    items: [
      {
        title: "Home",
        href: "/",
        icon: Home,
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
        children: [
          { title: "Kitchen Cabinets", href: "/products/kitchen-cabinets", icon: Package },
          { title: "Wardrobes", href: "/products/wardrobes", icon: Package },
          { title: "Bathroom Vanities", href: "/products/bathroom-vanities", icon: Package },
        ],
      },
      {
        title: "Services",
        href: "/services",
        icon: Wrench,
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
      },
      {
        title: "About",
        href: "/about",
        icon: Info,
      },
      {
        title: "Contact",
        href: "/contact",
        icon: Mail,
      },
    ],
  },
  // Add more sections as needed
]
```

### Step 7: Update Branding

Update the branding in the side panel header:

```tsx
// In the SidePanelNavigationEnhanced component
<div className="side-panel-header">
  <Link href="/" className="side-panel-logo">
    <div className="side-panel-logo-icon">
      <span>M</span> {/* Update to your logo */}
    </div>
    <span>ModuLux</span> {/* Update to your brand name */}
  </Link>
  
  <button
    onClick={handleToggleMenu}
    className="md:hidden p-1 text-gray-500 hover:text-gray-700"
    aria-label="Close navigation menu"
  >
    <X className="h-4 w-4" />
  </button>
</div>
```

### Step 8: Test Responsive Behavior

Verify that the navigation works correctly on:
- Desktop (≥768px): Side panel is always visible
- Tablet (640-767px): Mobile menu with overlay
- Mobile (<640px): Mobile menu with overlay

### Step 9: Update User Profile Section

Customize the user profile section if you have user authentication:

```tsx
// Update the user profile section
<div className="side-panel-user">
  <div className="side-panel-user-content">
    <div className="side-panel-user-avatar">
      <span>JD</span> {/* Update with user initials or avatar */}
    </div>
    <div className="side-panel-user-info">
      <p className="side-panel-user-name">John Doe</p> {/* Update with user name */}
      <p className="side-panel-user-role">Administrator</p> {/* Update with user role */}
    </div>
    <button className="side-panel-user-chevron">
      <ChevronDown className="h-4 w-4" />
    </button>
  </div>
</div>
```

## Post-Migration Checklist

### 1. Functionality Testing
- [ ] All navigation links work correctly
- [ ] Active states update properly when navigating
- [ ] Mobile menu opens and closes smoothly
- [ ] Search functionality works (if implemented)
- [ ] User profile section displays correctly

### 2. Responsive Testing
- [ ] Desktop layout displays side panel correctly
- [ ] Mobile menu functions properly
- [ ] Content spacing adjusts correctly
- [ ] Touch interactions work on mobile

### 3. Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen readers announce navigation correctly
- [ ] Focus indicators are visible
- [ ] ARIA labels are appropriate
- [ ] Color contrast meets WCAG standards

### 4. Performance Testing
- [ ] Component loads quickly
- [ ] Animations are smooth
- [ ] No layout shifts occur
- [ ] Mobile performance is acceptable

### 5. Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Rollback Plan

If issues are discovered after migration:

### Quick Rollback
1. Restore the original header files:
   ```bash
   cp components/header-backup.tsx components/header.tsx
   cp components/conditional-header-backup.tsx components/conditional-header.tsx
   ```

2. Remove the side panel CSS import from your layout

3. Revert the layout structure changes

### Gradual Rollback
1. Implement feature flags to toggle between header and side panel
2. Test thoroughly in staging environment
3. Deploy gradually to production with monitoring

## Common Issues and Solutions

### Issue: Content Overlapping Side Panel
**Solution**: Ensure your main content has the proper spacing classes:
```tsx
<main className="md:pl-64 pt-16">
  {/* Your content */}
</main>
```

### Issue: Mobile Menu Not Closing
**Solution**: Check that the mobile menu close functionality is working:
```tsx
useEffect(() => {
  if (isMobile) {
    setIsOpen(false)
  }
}, [pathname, isMobile])
```

### Issue: Active States Not Working
**Solution**: Verify the pathname detection logic:
```tsx
const isItemActive = (href: string) => {
  return pathname === href || pathname?.startsWith(href + "/")
}
```

### Issue: Animations Not Smooth
**Solution**: Check CSS transitions and ensure no conflicting styles:
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Update Navigation Data**: Keep navigation items current with site structure
2. **Monitor Performance**: Check for any performance degradation
3. **Test Accessibility**: Regular accessibility audits
4. **Update Dependencies**: Keep Lucide React and Radix UI packages updated

### Future Enhancements
1. **Dark Mode Support**: Implement theme switching
2. **Search Functionality**: Add real-time search capabilities
3. **User Preferences**: Remember collapsed states
4. **Internationalization**: Support for multiple languages

## Support and Resources

### Documentation
- [Side Panel Navigation Documentation](./side-panel-navigation-documentation.md)
- [CSS Styling Guide](./side-panel-navigation.css)

### Component Files
- `components/side-panel-navigation.tsx` - Basic implementation
- `components/side-panel-navigation-enhanced.tsx` - Enhanced implementation
- `components/side-panel-navigation.css` - Styling

### Testing Resources
- Use browser developer tools for responsive testing
- Install accessibility browser extensions
- Use performance monitoring tools

---

For additional support or questions about the migration, refer to the component documentation or consult with your development team.