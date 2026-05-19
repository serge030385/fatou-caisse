-- Fatou Caisse - schéma Supabase
-- Mode MVP: un seul admin, user_id et shop_id sont prêts pour auth/multi-boutiques plus tard.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  shop_id uuid null,
  name text not null,
  category text not null check (category in ('produit_africain', 'boisson', 'plat', 'autre')),
  sale_price numeric(12, 2) not null default 0,
  purchase_price numeric(12, 2) null,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 3,
  photo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  shop_id uuid null,
  sale_type text not null check (sale_type in ('product', 'free')),
  total_amount numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  sold_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  user_id uuid null,
  shop_id uuid null,
  item_name text not null,
  category text not null check (category in ('produit_africain', 'boisson', 'plat', 'autre')),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  purchase_unit_price numeric(12, 2) null,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  shop_id uuid null,
  category text not null check (category in ('achat_marchandise', 'loyer', 'transport', 'recharge', 'autre')),
  amount numeric(12, 2) not null default 0,
  note text null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.money_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  shop_id uuid null,
  customer_name text not null,
  phone text null,
  network text not null check (network in ('orange_money', 'mtn_mobile_money')),
  amount_fcfa numeric(14, 2) not null default 0,
  amount_tl numeric(12, 2) not null default 0,
  commission numeric(12, 2) not null default 0,
  status text not null check (status in ('paye', 'en_attente', 'termine')),
  note text null,
  transfer_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  shop_id uuid null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shop_id, key)
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_stock_idx on public.products(stock_quantity);
create index if not exists sales_sold_at_idx on public.sales(sold_at);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists expenses_expense_date_idx on public.expenses(expense_date);
create index if not exists money_transfers_customer_idx on public.money_transfers(customer_name);
create index if not exists money_transfers_date_idx on public.money_transfers(transfer_date);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at before update on public.sales
for each row execute function public.set_updated_at();

drop trigger if exists sale_items_set_updated_at on public.sale_items;
create trigger sale_items_set_updated_at before update on public.sale_items
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists money_transfers_set_updated_at on public.money_transfers;
create trigger money_transfers_set_updated_at before update on public.money_transfers
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();

-- Politiques MVP sans authentification.
-- Attention: ces politiques ouvrent les tables à la clé anon. Pour une vraie production,
-- remplacez-les par des règles auth.uid() = user_id avant de partager l'URL publiquement.
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.money_transfers enable row level security;
alter table public.settings enable row level security;

drop policy if exists "mvp_products_all" on public.products;
create policy "mvp_products_all" on public.products for all using (true) with check (true);

drop policy if exists "mvp_sales_all" on public.sales;
create policy "mvp_sales_all" on public.sales for all using (true) with check (true);

drop policy if exists "mvp_sale_items_all" on public.sale_items;
create policy "mvp_sale_items_all" on public.sale_items for all using (true) with check (true);

drop policy if exists "mvp_expenses_all" on public.expenses;
create policy "mvp_expenses_all" on public.expenses for all using (true) with check (true);

drop policy if exists "mvp_money_transfers_all" on public.money_transfers;
create policy "mvp_money_transfers_all" on public.money_transfers for all using (true) with check (true);

drop policy if exists "mvp_settings_all" on public.settings;
create policy "mvp_settings_all" on public.settings for all using (true) with check (true);
