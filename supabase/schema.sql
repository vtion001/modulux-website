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
