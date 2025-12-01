## Data Audit (Current JSON)
- Projects: `data/projects.json` contains fields `id,title,location,year,type,description,image,images[],services[]`
- Blog: `data/blog.json` contains fields `id,title,excerpt,description,image,author,date,readTime,category`

## Goal
- One‑time, idempotent seeding of initial Projects and Blog content from JSON into Supabase tables so pages/API reflect data again.

## Target Tables
- `projects`: columns already used in code (`id,title,location,year,type,description,image,images,services`)
- `blog_posts`: columns already used (`id,title,excerpt,description,image,author,date,read_time,category`)

## Implementation Plan
- Add a single admin-only API route `app/api/seed/initial-content/route.ts` that:
  - Reads `data/projects.json`, upserts each item into `projects` using `onConflict: id`
  - Reads `data/blog.json`, upserts each item into `blog_posts`; map `readTime` → `read_time`
  - Returns a summary `{ projectsSeeded, blogSeeded }`
- Add a small Admin button on the Dashboard to call this route:
  - Location: `app/admin/page.tsx` (below stats)
  - Button: “Seed Initial Content” (hidden/disabled after success in the same session)
- Keep operations idempotent:
  - Use `upsert` with `onConflict: id` to avoid duplicates
  - Do not delete existing rows; only insert missing or update stale

## Verification Steps
- Call `GET /api/projects` and `GET /api/blog` to confirm results return non-empty arrays
- Navigate Admin and public pages:
  - `/admin/projects`, `/projects` list populated
  - `/admin/blog`, `/blog` list populated
- Spot-check a few `id`s from JSON appear

## Rollback / Safety
- No destructive operations; only upserts
- Re-run seeding safely at any time; revalidations ensure UI refresh

## Notes
- Uses existing `supabaseServer` client and env (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- No email/conversation data is touched

Please confirm and I’ll implement the route + button, run the seed, and verify pages reflect the data.