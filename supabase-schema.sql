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

create table if not exists public.catalog_products (
  code text primary key,
  measure_code text not null,
  storage_path text not null,
  width integer not null,
  height integer not null,
  price_options jsonb not null default '[]'::jsonb,
  theme_id text not null default 'abstracto',
  created_at timestamptz not null default now(),
  constraint catalog_products_measure_check check (
    measure_code in ('DNG', 'SG', 'SGF', 'TC', 'TEXTURADO', 'XG', 'XGM')
  ),
  constraint catalog_products_theme_check check (
    theme_id in (
      'abstracto',
      'animales',
      'botanico',
      'objetos',
      'paisajes',
      'retratos',
      'texturas',
      'vehiculos'
    )
  ),
  constraint catalog_products_dimensions_check check (width > 0 and height > 0),
  constraint catalog_products_price_options_is_array check (
    jsonb_typeof(price_options) = 'array'
  )
);

create index if not exists catalog_products_created_at_idx
  on public.catalog_products (created_at asc);

alter table public.catalog_products enable row level security;

-- Catalogo dinamico para items agregados desde admin. Tambien lo leen/escriben
-- Route Handlers con SUPABASE_SERVICE_ROLE_KEY, por eso no necesita policies
-- publicas.

create table if not exists public.catalog_product_order (
  code text primary key,
  sort_order integer not null,
  updated_at timestamptz not null default now(),
  constraint catalog_product_order_sort_order_check check (sort_order >= 0)
);

create index if not exists catalog_product_order_sort_order_idx
  on public.catalog_product_order (sort_order asc);

alter table public.catalog_product_order enable row level security;

create table if not exists public.catalog_highlights (
  target_type text not null,
  target_id text not null,
  updated_at timestamptz not null default now(),
  primary key (target_type, target_id),
  constraint catalog_highlights_target_type_check check (
    target_type in ('folder', 'measure', 'product')
  )
);

create index if not exists catalog_highlights_updated_at_idx
  on public.catalog_highlights (updated_at desc);

alter table public.catalog_highlights enable row level security;

alter table public.catalog_highlights
  drop constraint if exists catalog_highlights_target_type_check;

alter table public.catalog_highlights
  add constraint catalog_highlights_target_type_check check (
    target_type in ('folder', 'measure', 'product')
  );
