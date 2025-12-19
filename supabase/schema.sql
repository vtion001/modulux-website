create table if not exists public.calculator_pricing (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz
);

create table if not exists public.calculator_pricing_versions (
  ts bigint primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_calculator_pricing_versions_ts on public.calculator_pricing_versions (ts desc);

create table if not exists public.proposal_drafts (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists public.fabricators (
  id text primary key,
  name text not null,
  email text,
  rates jsonb not null,
  history jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_fabricators_name on public.fabricators (name);

create table if not exists public.fabricator_rfqs (
  id text primary key,
  fabricator_id text,
  to_email text,
  name text,
  subject text,
  message text,
  ok boolean,
  gmail_id text,
  attachments jsonb,
  files jsonb,
  ts bigint,
  created_at timestamptz default now()
);

create index if not exists idx_fabricator_rfqs_fabricator on public.fabricator_rfqs (fabricator_id);

create table if not exists public.project_tasks (
  id text primary key,
  project text,
  title text not null,
  description text,
  assignees text[],
  assignees_json jsonb,
  due_date text,
  priority text,
  progress int,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_project_tasks_status on public.project_tasks (status);
create index if not exists idx_project_tasks_due_date on public.project_tasks (due_date);
create index if not exists idx_project_tasks_project on public.project_tasks (project);

-- Analytics events for lightweight CTA tracking
create table if not exists public.analytics_events (
  id text primary key,
  name text not null,
  props_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_analytics_events_name on public.analytics_events (name);
create index if not exists idx_analytics_events_created on public.analytics_events (created_at desc);

create table if not exists public.projects (
  id text primary key,
  title text,
  location text,
  year text,
  type text,
  description text,
  image text,
  images jsonb,
  services jsonb,
  sourcing text,
  design_start text,
  install_target text,
  assignees_default text[],
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_projects_type on public.projects (type);
create index if not exists idx_projects_year on public.projects (year);
create index if not exists idx_projects_location on public.projects (location);

create table if not exists public.project_versions (
  ts bigint primary key,
  id text,
  data jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_project_versions_ts on public.project_versions (ts desc);
create index if not exists idx_project_versions_id on public.project_versions (id);
