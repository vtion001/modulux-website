## Summary
Implement a true scrollable navigation area in the admin side panel so users can access items at the bottom on all screen sizes.

## Changes
1. CSS layout fix for side panel container
- Update `.side-panel-nav` to be a column flex container so the scroll area can occupy remaining height:
  - `display: flex;`
  - `flex-direction: column;`
  - (keeps existing `position: fixed`, `height: 100vh`, `width: 16rem`)

2. Ensure the scroll region actually scrolls
- Confirm `.side-panel-scroll-area` has:
  - `flex: 1;`
  - `overflow-y: auto;`
  - `scrollbar-width: thin;` and WebKit scrollbar styles (already present)
- Optional smooth scrolling on mobile:
  - `-webkit-overflow-scrolling: touch;`
  - `overscroll-behavior: contain;`

3. No JSX restructuring required
- `components/side-panel-navigation-enhanced.tsx` already renders header → search → `<ScrollArea className="side-panel-scroll-area">` → user section. With the flex fix, the scroll area will fill remaining height and scroll correctly.

## Files to Update
- `components/side-panel-navigation.css`
  - Add `display: flex; flex-direction: column;` to `.side-panel-nav` (near lines 23–35)
  - Optionally add mobile smooth scroll properties to `.side-panel-scroll-area`

## Verification
- Open `/admin` and test in desktop and mobile widths:
  - Confirm the scroll bar appears inside the side panel
  - Scroll to reach "Proposal Creator" and other bottom items
  - Ensure header/search/user blocks remain fixed within the panel while only the middle nav area scrolls
- Check for no layout shifts of main content (content uses `md:pl-64` as before)

## Notes
- The root cause is the side panel container missing flex layout; child `.side-panel-scroll-area` already has `overflow-y: auto` but cannot fill remaining space without a flex parent.