-- Migration 003 — Policies de escrita para admin (service_role)
-- Sem isso, DELETE e UPDATE via supabaseAdmin() são bloqueados silenciosamente pelo RLS
-- Rodar em: Supabase Dashboard → SQL Editor → New query → Run

-- Products: acesso total via service_role
create policy "service full products"
  on products for all
  using (true)
  with check (true);

-- Artists: acesso total via service_role
create policy "service full artists"
  on artists for all
  using (true)
  with check (true);

-- Tenants: acesso total via service_role
create policy "service full tenants"
  on tenants for all
  using (true)
  with check (true);
