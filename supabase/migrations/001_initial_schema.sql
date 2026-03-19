-- ============================================================
-- Migration 001 — Schema inicial da Festival Store
-- Rodar em: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- TENANTS
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  primary_color text default '#0B12CC',
  created_at timestamptz default now()
);

-- ARTISTS
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  slug text not null unique,
  name text not null,
  real_name text,
  origin text,
  bio text,
  avatar_url text,
  instagram text,
  tier text default 'Destaque',
  active boolean default true,
  created_at timestamptz default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  artist_id uuid references artists(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  price integer not null,     -- em centavos (ex: 8900 = R$89)
  category text not null,
  image_url text,             -- mockup gerado
  artwork_url text,           -- arte original do artista
  active boolean default true,
  stock integer default 0,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  status text not null default 'pending',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_cpf text,
  shipping_address jsonb,
  shipping_method text,
  shipping_cost integer default 0,
  subtotal integer not null,
  total integer not null,
  payment_method text,
  payment_id text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  artist_name text,
  category text,
  price integer not null,
  quantity integer not null default 1,
  subtotal integer not null
);

-- RLS
alter table tenants enable row level security;
alter table artists enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Leitura pública (vitrine)
create policy "public read tenants"  on tenants  for select using (true);
create policy "public read artists"  on artists  for select using (active = true);
create policy "public read products" on products for select using (active = true);

-- Orders: acesso total via service_role (API routes server-side)
create policy "service full orders"      on orders      using (true) with check (true);
create policy "service full order_items" on order_items using (true) with check (true);

-- Indexes
create index if not exists idx_artists_slug    on artists(slug);
create index if not exists idx_artists_tenant  on artists(tenant_id);
create index if not exists idx_products_slug   on products(slug);
create index if not exists idx_products_artist on products(artist_id);
create index if not exists idx_products_tenant on products(tenant_id);
create index if not exists idx_orders_tenant   on orders(tenant_id);
create index if not exists idx_orders_status   on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);

-- ── SEED ─────────────────────────────────────────────────────

insert into tenants (slug, name, logo_url, primary_color)
values ('btcfestival', 'BTC Festival', '/tenants/btcfestival/logo.png', '#0B12CC')
on conflict (slug) do nothing;

insert into artists (tenant_id, slug, name, real_name, origin, bio, avatar_url, instagram, tier)
select
  t.id,
  'scmart',
  'Scmart',
  'Sebastian Moreno',
  'Chile',
  'Sebastian é um artista visual e muralista com uma sólida trajetória internacional, tendo levado sua arte a sete países através de festivais de renome como o Meeting of Styles (Alemanha, Suécia, Finlândia, Jamaica, entre outros). Sua obra é uma busca pela harmonia entre a estética urbana e a natureza, transformando muros em palcos de experimentação técnica e visual.',
  '/artistas/scmart-perfil.jpg',
  '@s.cmart_',
  'Destaque'
from tenants t where t.slug = 'btcfestival'
on conflict (slug) do nothing;

insert into products (tenant_id, artist_id, slug, name, price, category, image_url, artwork_url)
select
  t.id, a.id,
  'scmart-natureza-urbana-camiseta', 'Natureza Urbana — Camiseta',
  8900, 'Camiseta',
  '/produtos/scmart/camiseta-lifestyle.png',
  '/artistas/scmart.png'
from tenants t join artists a on a.tenant_id = t.id
where t.slug = 'btcfestival' and a.slug = 'scmart'
on conflict (slug) do nothing;

insert into products (tenant_id, artist_id, slug, name, price, category, image_url, artwork_url)
select
  t.id, a.id,
  'scmart-mural-chile-poster', 'Mural Chile — Pôster Fine Art',
  12900, 'Pôster',
  '/produtos/scmart/tela-vertical.png',
  '/artistas/scmart.png'
from tenants t join artists a on a.tenant_id = t.id
where t.slug = 'btcfestival' and a.slug = 'scmart'
on conflict (slug) do nothing;

insert into products (tenant_id, artist_id, slug, name, price, category, image_url, artwork_url)
select
  t.id, a.id,
  'scmart-meeting-styles-tela', 'Meeting of Styles — Tela s/ Moldura',
  17900, 'Tela',
  '/produtos/scmart/tela-vertical.png',
  '/artistas/scmart.png'
from tenants t join artists a on a.tenant_id = t.id
where t.slug = 'btcfestival' and a.slug = 'scmart'
on conflict (slug) do nothing;
