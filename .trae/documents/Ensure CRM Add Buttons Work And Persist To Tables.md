## Summary
Make the three CRM quick-add buttons (Lead, Deal, Contact) fully functional with validation, feedback, and verified persistence to their respective tables in `data/crm.json`.

## Changes
1. Add required-field validation in server actions
- Leads: require at least `name` or `email`
- Deals: require `title` and `contact_id`; coerce `value` to number ≥ 0
- Contacts: require `c_name` or `c_email`; parse `c_tags` safely

2. User feedback on submission
- Replace plain `SaveForm` usage with `useActionState` wrappers for the three forms to display a small inline success/error message below each form
- Keep `SubmitButton` to reflect pending state

3. Persistence verification
- Confirm writes append to arrays in `data/crm.json` and revalidate UI via `revalidatePath("/admin/crm")`
- Add defensive JSON parse and array defaults to avoid runtime errors when file is empty or missing

## Files To Update
- `app/admin/crm/page.tsx`
  - Tighten validation inside `addLead`, `addDeal`, `addContact`
  - Swap the three quick-add forms to `useActionState` for inline statuses

## Validation
- In dev, add a lead, contact, and a deal; verify they appear immediately in their tables
- Reload `admin/crm` to confirm persistence and correctness in `data/crm.json`

## Notes
- No schema changes; uses the existing CRM JSON structure
- Accessibility: status messages use `aria-live` and buttons use pending states already via `SubmitButton`