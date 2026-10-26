create table if not exists public.requisitions (
  id text primary key default gen_random_uuid()::text,
  item_id text not null references public.items(id) on delete restrict,
  item_code text not null,
  item_name text not null,
  unit text not null,
  quantity integer not null check (quantity > 0),
  department_id text references public.departments(id) on delete set null,
  department_name text,
  purpose text,
  requester_id text not null references public.app_users(id) on delete restrict,
  requester_name text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED')),
  reviewed_by text references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requisitions_requester_created_idx
  on public.requisitions (requester_id, created_at desc);
create index if not exists requisitions_status_created_idx
  on public.requisitions (status, created_at desc);

create table if not exists public.issue_reports (
  id text primary key default gen_random_uuid()::text,
  item_id text references public.items(id) on delete set null,
  item_name text not null check (length(trim(item_name)) > 0),
  issue_type text not null check (issue_type in ('DAMAGED', 'DEFECTIVE', 'MISSING', 'OUT_OF_STOCK', 'OTHER')),
  details text,
  reporter_id text not null references public.app_users(id) on delete restrict,
  reporter_name text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  resolution_note text,
  resolved_by text references public.app_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issue_reports_reporter_created_idx
  on public.issue_reports (reporter_id, created_at desc);
create index if not exists issue_reports_status_created_idx
  on public.issue_reports (status, created_at desc);

alter table public.requisitions enable row level security;
alter table public.issue_reports enable row level security;
revoke all on public.requisitions, public.issue_reports from anon, authenticated;
grant all on public.requisitions, public.issue_reports to service_role;
