create table if not exists public.mava_admin_store (
  id text primary key,
  unavailable_product_ids text[] not null default '{}',
  orders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mava_admin_store enable row level security;
