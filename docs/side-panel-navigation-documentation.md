# Side Panel Navigation Documentation

## Overview

The Side Panel Navigation component transforms the traditional header navigation into a modern, clean side panel system that matches the visual style and user experience of the reference design. This component provides a comprehensive navigation solution with collapsible sections, responsive behavior, and full accessibility support.

## Features

### Visual Design
- **Clean Layout**: White background with subtle borders and shadows
- **Typography**: Modern sans-serif fonts with clear hierarchy
- **Color Scheme**: 
  - Primary: Blue accents (#2563eb) for active states and badges
  - Text: Gray scale (#374151, #6b7280, #9ca3af)
  - Background: White (#ffffff) with light gray borders (#e5e7eb)
- **Iconography**: Lucide React icons with consistent 4px sizing
- **Spacing**: Generous padding (16-24px) with consistent gaps

### Functionality
- **Collapsible Sections**: Expandable navigation items with smooth animations
- **Active State Indicators**: Blue background and border for current page
- **Badge Support**: Notification badges with pill styling
- **Search Integration**: Built-in search bar with icon
- **User Profile**: Avatar and user information section
- **Responsive Design**: Mobile-first approach with desktop optimization

### Accessibility
- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard support with focus indicators
- **Focus Management**: Proper focus rings and tab order
- **Screen Reader Support**: Semantic HTML and ARIA attributes
- **Color Contrast**: WCAG 2.1 AA compliant color ratios

## Component Structure

### Main Components

#### SidePanelNavigation
The main container component that orchestrates the entire navigation system.

```tsx
export function SidePanelNavigation() {
  // Component logic and state management
}
```

#### NavItemComponent
Handles individual navigation items with support for:
- Active states
- Child items (collapsible)
- Badges
- Icons
- Keyboard navigation

#### NavSectionComponent
Manages navigation sections with:
- Section headers
- Grouped navigation items
- Consistent spacing and styling

### Navigation Data Structure

```typescript
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
```

## Usage

### Basic Implementation

```tsx
import { SidePanelNavigation } from "@/components/side-panel-navigation"

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <SidePanelNavigation />
      <main className="md:pl-64 pt-16">
        {children}
      </main>
    </div>
  )
}
```

### Custom Navigation Data

```tsx
const customNavigationData: NavSection[] = [
  {
    title: "CUSTOM SECTION",
    items: [
      {
        title: "Custom Page",
        href: "/custom",
        icon: CustomIcon,
        badge: "NEW",
        children: [
          { title: "Sub Page", href: "/custom/sub", icon: SubIcon }
        ]
      }
    ]
  }
]
```

## Styling Guidelines

### CSS Classes and Customization

#### Layout Classes
- `w-64`: Fixed width for desktop
- `h-screen`: Full viewport height
- `bg-white`: White background
- `border-r border-gray-200`: Right border

#### Interactive States
- `hover:bg-gray-100/50`: Light hover background
- `focus:outline-none focus:ring-2 focus:ring-primary/50`: Focus indicators
- `bg-blue-50 text-blue-700 border-r-2 border-blue-700`: Active state

#### Responsive Classes
- `md:translate-x-0`: Desktop positioning
- `md:hidden`: Mobile-only elements
- `md:pl-64`: Content padding for desktop

### Custom Theme Integration

The component uses CSS custom properties for theming:

```css
:root {
  --sidebar: #ffffff;
  --sidebar-foreground: #1f2937;
  --sidebar-primary: #1e3a2e;
  --sidebar-accent: #cd853f;
  --sidebar-border: #e5e7eb;
  --sidebar-ring: rgba(30, 58, 46, 0.3);
}
```

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- CSS Grid and Flexbox
- CSS Custom Properties
- ES6+ JavaScript features
- Intersection Observer API (for scroll areas)

### Polyfills
For older browser support, include:
- `core-js` for JavaScript features
- `focus-visible` for focus indicators
- `resize-observer-polyfill` for responsive behavior

## Dependencies

### Required Packages
```json
{
  "lucide-react": "^0.454.0",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "@radix-ui/react-separator": "^1.1.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5"
}
```

### Peer Dependencies
- React 18+
- Next.js 14+
- Tailwind CSS 3.4+

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Icons are imported individually to reduce bundle size
2. **Memoization**: Use React.memo for navigation items that don't change frequently
3. **Event Debouncing**: Resize and scroll events are debounced
4. **CSS Optimization**: Critical CSS is inlined, non-critical styles are loaded asynchronously

### Bundle Size Impact
- Core component: ~15KB gzipped
- Icons: ~3KB per icon (tree-shaken)
- Total estimated impact: ~25KB gzipped

## Maintenance Guide

### Adding New Navigation Items

1. **Update the navigation data structure**:
```tsx
const navigationData: NavSection[] = [
  {
    title: "EXISTING SECTION",
    items: [
      // ... existing items
      {
        title: "New Item",
        href: "/new-item",
        icon: NewIcon,
        badge: "BETA"
      }
    ]
  }
]
```

2. **Import the new icon**:
```tsx
import { NewIcon } from "lucide-react"
```

3. **Test responsive behavior** on mobile and desktop

### Modifying Styling

1. **Update Tailwind classes** in the component
2. **Test color contrast** for accessibility
3. **Verify responsive behavior** across breakpoints
4. **Check keyboard navigation** functionality

### Updating User Profile Section

The user profile section can be customized by modifying:
- Avatar component and fallback logic
- User name and role display
- Dropdown menu items
- Profile picture source

## Troubleshooting

### Common Issues

#### Navigation Not Collapsing on Mobile
- Check that `isMobile` state is updating correctly
- Verify that `window.innerWidth` is being measured accurately
- Ensure event listeners are properly attached and cleaned up

#### Active State Not Working
- Verify that `usePathname()` is returning the correct path
- Check that `isItemActive()` function logic is correct
- Ensure that `pathname` dependency is included in useEffect hooks

#### Icons Not Rendering
- Verify that `lucide-react` is installed and imported correctly
- Check that icon components are being passed correctly to the `icon` prop
- Ensure that CSS classes for icon sizing are applied

#### Focus Indicators Not Visible
- Check that `focus:ring` classes are applied
- Verify that `outline-none` is not overriding focus styles
- Test with keyboard navigation (Tab key)

### Debug Mode

Enable debug mode by adding this to the component:

```tsx
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('Navigation state:', { isOpen, isMobile, expandedItems })
}
```

## Migration from Header Component

### Step 1: Replace Header Import
```tsx
// Old
import { Header } from "@/components/header"

// New
import { SidePanelNavigation } from "@/components/side-panel-navigation"
```

### Step 2: Update Layout Structure
```tsx
// Old
<Header />
<main>{children}</main>

// New
<SidePanelNavigation />
<main className="md:pl-64 pt-16">{children}</main>
```

### Step 3: Update Conditional Header Logic
Modify the `ConditionalHeader` component to use the new side panel navigation:

```tsx
export function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin") || pathname === "/proposal" || pathname?.startsWith("/proposal/") || pathname === "/pitch-deck" || pathname?.startsWith("/pitch-deck/")) return null
  return <SidePanelNavigation />
}
```

## Testing

### Unit Tests
```tsx
describe('SidePanelNavigation', () => {
  it('renders navigation sections correctly', () => {
    render(<SidePanelNavigation />)
    expect(screen.getByText('OVERVIEW')).toBeInTheDocument()
  })

  it('handles mobile menu toggle', () => {
    render(<SidePanelNavigation />)
    const menuButton = screen.getByLabelText('Toggle navigation menu')
    fireEvent.click(menuButton)
    expect(screen.getByRole('navigation')).toHaveClass('translate-x-0')
  })
})
```

### Integration Tests
- Test navigation flow between pages
- Verify that active states update correctly
- Test keyboard navigation and focus management
- Verify responsive behavior on different screen sizes

### Accessibility Tests
- Run axe-core automated tests
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation flow
- Check color contrast ratios

## Future Enhancements

### Planned Features
1. **Dark Mode Support**: Automatic theme switching
2. **Search Functionality**: Real-time search with filtering
3. **User Preferences**: Collapsible section persistence
4. **Animation Improvements**: Smoother transitions and micro-interactions
5. **Internationalization**: Multi-language support

### Performance Improvements
1. **Virtual Scrolling**: For large navigation hierarchies
2. **Code Splitting**: Lazy load navigation sections
3. **Caching**: Cache navigation state and user preferences
4. **Progressive Enhancement**: Graceful degradation for older browsers