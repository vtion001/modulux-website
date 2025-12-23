-- Proposal drafts
create table if not exists public.proposal_drafts (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Fabricators
create table if not exists public.fabricators (
  id text primary key,
  name text not null,
  email text,
  phone text,
  category text,
  notes text,
  rates jsonb not null,
  units jsonb,
  history jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_fabricators_name on public.fabricators (name);

-- Fabricator RFQs
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

-- Project tasks
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

-- Projects
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

-- Project versions
create table if not exists public.project_versions (
  ts bigint primary key,
  id text,
  data jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_project_versions_ts on public.project_versions (ts desc);
create index if not exists idx_project_versions_id on public.project_versions (id);

-- Estimates generated from the calculator
create table if not exists public.calculator_estimates (
  id text primary key,
  project_type text,
  quality_tier text,
  linear_meters numeric,
  vat_included boolean default true,
  import_surcharge boolean default false,
  mfc_downgrade boolean default false,
  installation_included boolean default false,
  room_type_selection text,
  custom_room_name text,
  discount_rate numeric default 0,
  tax_rate numeric default 0.12,
  apply_tax boolean default true,
  subtotal numeric,
  tax_amount numeric,
  total_price numeric,
  unit_data jsonb,
  client_info jsonb,
  pricing_config jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_calculator_estimates_created on public.calculator_estimates (created_at desc);

-- CRM: Contacts
create table if not exists public.contacts (
  id text primary key,
  name text,
  email text,
  phone text,
  company text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_contacts_email on public.contacts (email);

-- CRM: Leads
create table if not exists public.leads (
  id text primary key,
  name text,
  email text,
  phone text,
  company text,
  source text,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_leads_status on public.leads (status);

-- CRM: Clients
create table if not exists public.clients (
  id text primary key,
  name text,
  email text,
  phone text,
  company text,
  status text default 'active',
  service text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- General Inquiries from website form
create table if not exists public.inquiries (
  id text primary key,
  name text,
  email text,
  phone text,
  message text,
  attachments jsonb,
  status text default 'new',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists idx_inquiries_created on public.inquiries (created_at desc);

-- Specification templates for different quality tiers
create table if not exists public.specification_templates (
  id uuid primary key default gen_random_uuid(),
  tier text not null unique,
  items jsonb not null default '[]'::jsonb,
  exclusive jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Initial seeds for specification templates
insert into public.specification_templates (tier, items, exclusive)
values 
  ('standard', '["Carcass: 18mm MR MFC Melamine Board", "Door: 18mm MR MFC Melamine Board", "Hinges: Zinc Plated 3D Hinges Soft Closing", "Drawers: Regular Wooden Drawing Box ( Soft Closing )", "Countertop: Granite Countertop"]'::jsonb, '["Special Mechanism", "Lighting", "Appliances"]'::jsonb),
  ('premium', '["Carcass: 18mm Melamine Marine Plywood", "Door: 18mm MDF PETG/UV Ray Gloss / Synchronized Boards", "Hinges: Hettich Hinges ( Soft Closing )", "Drawers: Hettich Tandem Box Drawers ( Soft Closing )", "Countertop: Synthetic Quartz Countertop"]'::jsonb, '["Special Mechanism", "Lighting", "Appliances"]'::jsonb),
  ('luxury', '["Carcass: 18mm Celuka PVC Boards", "Door: 18mm MDF PETG/Acrylic Boards", "Hinges: Blum Hinges ( Soft Closing )", "Drawers: Blum Tandem Box Drawers ( Soft Closing )", "Countertop: Synthetic Quartz Countertop"]'::jsonb, '["Special Mechanism", "Lighting", "Appliances"]'::jsonb)
on conflict (tier) do update set 
  items = excluded.items, 
  exclusive = excluded.exclusive, 
  updated_at = now();

-- Enable RLS on all tables
alter table public.proposal_drafts enable row level security;
alter table public.fabricators enable row level security;
alter table public.fabricator_rfqs enable row level security;
alter table public.project_tasks enable row level security;
alter table public.analytics_events enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.specification_templates enable row level security;
alter table public.calculator_estimates enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.inquiries enable row level security;

-- Policies for proposal_drafts
drop policy if exists "Admins can manage proposal drafts" on public.proposal_drafts;
create policy "Admins can manage proposal drafts" on public.proposal_drafts for all to authenticated using (true) with check (true);

-- Policies for fabricators
drop policy if exists "Admins can manage fabricators" on public.fabricators;
create policy "Admins can manage fabricators" on public.fabricators for all to authenticated using (true) with check (true);

-- Policies for fabricator_rfqs
drop policy if exists "Admins can manage fabricator rfqs" on public.fabricator_rfqs;
create policy "Admins can manage fabricator rfqs" on public.fabricator_rfqs for all to authenticated using (true) with check (true);

-- Policies for project_tasks
drop policy if exists "Admins can manage project tasks" on public.project_tasks;
create policy "Admins can manage project tasks" on public.project_tasks for all to authenticated using (true) with check (true);

-- Policies for analytics_events
drop policy if exists "Public can insert analytics" on public.analytics_events;
create policy "Public can insert analytics" on public.analytics_events for insert with check (true);

drop policy if exists "Admins can read analytics" on public.analytics_events;
create policy "Admins can read analytics" on public.analytics_events for select to authenticated using (true);

-- Policies for projects
drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects" on public.projects for select using (true);

drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects" on public.projects for all to authenticated using (true) with check (true);

-- Policies for project_versions
drop policy if exists "Admins can manage project versions" on public.project_versions;
create policy "Admins can manage project versions" on public.project_versions for all to authenticated using (true) with check (true);

-- Policies for specification_templates
drop policy if exists "Public can read specifications" on public.specification_templates;
create policy "Public can read specifications" on public.specification_templates for select using (true);

drop policy if exists "Admins can manage specifications" on public.specification_templates;
create policy "Admins can manage specifications" on public.specification_templates for all to authenticated using (true) with check (true);

-- Policies for calculator_estimates
drop policy if exists "Admins can manage calculator estimates" on public.calculator_estimates;
create policy "Admins can manage calculator estimates" on public.calculator_estimates for all to authenticated using (true) with check (true);

-- Policies for contacts
drop policy if exists "Admins can manage contacts" on public.contacts;
create policy "Admins can manage contacts" on public.contacts for all to authenticated using (true) with check (true);

-- Policies for leads
drop policy if exists "Admins can manage leads" on public.leads;
create policy "Admins can manage leads" on public.leads for all to authenticated using (true) with check (true);

-- Policies for clients
drop policy if exists "Admins can manage clients" on public.clients;
create policy "Admins can manage clients" on public.clients for all to authenticated using (true) with check (true);

-- Policies for inquiries
drop policy if exists "Admins can manage inquiries" on public.inquiries;
create policy "Admins can manage inquiries" on public.inquiries for all to authenticated using (true) with check (true);

drop policy if exists "Public can insert inquiries" on public.inquiries;
create policy "Public can insert inquiries" on public.inquiries for insert with check (true);