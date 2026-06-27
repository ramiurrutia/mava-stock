create table if not exists public.mava_admin_store (
  id text primary key,
  unavailable_product_ids text[] not null default '{}',
  orders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mava_admin_store enable row level security;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  whatsapp text not null,
  business_name text not null default '',
  items jsonb not null default '[]'::jsonb,
  status text not null default 'nuevo',
  total integer not null default 0,
  created_at timestamptz not null default now(),
  constraint orders_items_is_array check (jsonb_typeof(items) = 'array'),
  constraint orders_status_check check (
    status in ('nuevo', 'para_armar', 'listo', 'entregado', 'cancelado')
  ),
  constraint orders_total_check check (total >= 0)
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

alter table public.orders enable row level security;

-- Esta tabla la escribe y lee Next desde Route Handlers con
-- SUPABASE_SERVICE_ROLE_KEY. No agregamos policies publicas para no exponer
-- pedidos desde el cliente.
