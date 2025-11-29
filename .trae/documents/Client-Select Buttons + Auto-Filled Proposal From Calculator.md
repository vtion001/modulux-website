## Summary

Add client selection buttons on the Calculator’s “Your Estimate” card. When a client is chosen, clicking “Request Detailed Quote” will create a proposal draft and open the Proposal Creator pre-filled with client and estimate details.

## UI Changes (Calculator)

1. Client selector on the estimate card

* Add a compact client picker (buttons + search) situated above the breakdown or near the “Request Detailed Quote” button.

* Source contacts from CRM (`data/crm.json → contacts[]`). Show the most recent 3–5 contacts and a “Search…” input.

1. Button behavior

* “Request Detailed Quote” stays disabled until a client is selected.

* On click, create proposal draft and navigate to the Proposal Creator.

## Data & Flow

1. Map calculator state → proposal line items

* For each enabled unit category (`base`, `hanging`, `tall`), create a line item:

  * description: e.g., `Base cabinets (luxury)`

  * quantity: meters

  * unitPrice: computed per-meter rate used in the estimate

* Include totals: subtotal, tax, discount, total.

1. Draft creation

* Create an API route `POST /api/proposals/create` that accepts payload `{ client, title, items, taxRate, discount, notes }` and returns `{ id }`.

* Persist to `data/proposals.json` (append array of drafts; create file if missing).

1. Navigation

* After `POST` succeeds, redirect to `/admin/proposals?id=<id>`.

## Proposal Page Prefill

1. Read draft by `id`

* Update `/admin/proposals` to accept `searchParams.id`.

* If `id` is present, fetch `/data/proposals.json` client-side and initialize local state from the matching record.

* Set: `clientName`, `clientEmail`, `clientCompany`, `title`, `items[]`, `taxRate`, `discount`, `notes`, `issueDate` (today), `validUntil` (optional).

1. Fallbacks

* If `id` not found, keep current defaults.

## Files to Update

* `app/calculator/page.tsx`: add client selector UI and click handler to call the API and redirect.

* `app/api/proposals/create/route.ts`: new POST endpoint writing to `data/proposals.json`.

* `app/admin/proposals/page.tsx`: initialize state from `searchParams.id` by fetching `/data/proposals.json`.

## Validation

* In dev, select a client and click “Request Detailed Quote”; verify a new draft appears in `data/proposals.json` and Proposal Creator opens pre-filled.

* Confirm line items and total match the calculator’s breakdown.

* Test multiple unit combinations and absence of client selection (button disabled).

## Notes

* No schema changes to CRM; contacts are read-only.

* The initial implementation uses client-side fetch for simplicity; we can later move draft-loading to a server component for SSR if desired.

