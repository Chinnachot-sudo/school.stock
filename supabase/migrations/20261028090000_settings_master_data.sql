create table if not exists public.storage_locations (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  name text not null,
  building_room text,
  description text,
  capacity text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_locations_code_nonempty check (length(trim(code)) > 0),
  constraint storage_locations_name_nonempty check (length(trim(name)) > 0)
);

create table if not exists public.units_of_measure (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  name text not null,
  measurement_type text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_of_measure_code_nonempty check (length(trim(code)) > 0),
  constraint units_of_measure_name_nonempty check (length(trim(name)) > 0),
  constraint units_of_measure_type_nonempty check (length(trim(measurement_type)) > 0)
);

create table if not exists public.customer_tier_pricing (
  id text primary key default gen_random_uuid()::text,
  customer_type text not null unique check (customer_type in ('STUDENT', 'PARENT', 'TEACHER', 'GENERAL')),
  label text not null,
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_tier_pricing_label_nonempty check (length(trim(label)) > 0)
);

alter table public.storage_locations enable row level security;
alter table public.units_of_measure enable row level security;
alter table public.customer_tier_pricing enable row level security;

create index if not exists storage_locations_status_idx on public.storage_locations(status);
create index if not exists units_of_measure_status_idx on public.units_of_measure(status);
create index if not exists customer_tier_pricing_status_idx on public.customer_tier_pricing(status);
