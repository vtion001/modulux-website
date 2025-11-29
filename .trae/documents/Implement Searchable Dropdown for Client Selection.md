## What I Found
- The "Select Client" UI is rendered in `components/admin/admin-calculator-embed.tsx:379-407`. It currently shows a grid of contact buttons plus a separate "Search contacts" input and a fallback message.
- It already references CRM contacts by fetching `/data/crm.json` and using `db.contacts` in `components/admin/admin-calculator-embed.tsx:114-121`.
- The browser HTML you highlighted ("No matches. Manage contacts in CRM") matches the fallback in `components/admin/admin-calculator-embed.tsx:405-407`.

## Proposed Change
- Replace the current grid + text input with a single dropdown button that opens a searchable panel.
- Use an anchored popover to present:
  1) A search input field at the top
  2) A scrollable list of contact options showing name and email
  3) A clear fallback when there are no contacts
- Selecting an item sets `selectedClient` and closes the dropdown.

## Technical Implementation
- In `components/admin/admin-calculator-embed.tsx`:
  - Add local state `isClientPickerOpen` and `query`.
  - Replace the block at `components/admin/admin-calculator-embed.tsx:379-407` with a button (shows selected client or "Select Client") that toggles a `Popover` (Radix UI is already in dependencies).
  - Inside the popover, render:
    - `input` for search; on change, filter `contactsAll` and show results.
    - A list (`role="listbox"`) of results with keyboard navigation; items show name and email (and optionally company/tags).
    - Fallback message linking to `/admin/crm` when `contactsAll.length===0` or no matches.
  - Keep existing `selectedClient` wiring so the "Request Detailed Quote" button (`components/admin/admin-calculator-embed.tsx:409-461`) continues to work unchanged.

## Accessibility & UX
- Use focus management: focus the search input when opening the dropdown; allow Escape to close; arrow keys to navigate items.
- Add ARIA attributes: `aria-expanded`, `aria-controls` on the trigger; `role="listbox"` on results; `role="option"` on items; `aria-selected` on the current selection.
- Maintain styling with existing Tailwind utility classes for consistency.

## Data Source Confirmation
- Confirmed: contacts are sourced from CRM (`/data/crm.json`) via `fetch` in `components/admin/admin-calculator-embed.tsx:114-121` and stored in `contactsAll` / `contacts`.

## Validation Plan
- Use the existing seeded contact(s) in `data/crm.json` to verify:
  - Dropdown opens and focuses the search field
  - Filtering works by name/email/company/tags (same logic as current)
  - Selecting populates `selectedClient` and enables the quote button
  - Fallback link appears when no matches

## Scope
- Client-side UI only; no back-end changes.
- No breaking changes to current calculator behavior.

Please confirm to proceed. Once confirmed, I will implement the dropdown with search as described and verify it end-to-end.