-- ============================================================
-- Migration 002 — Supabase Storage bucket para mockups
-- Rodar em: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Criar bucket público "produtos" para armazenar mockups gerados
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- Permitir leitura pública dos mockups
create policy "public read produtos"
  on storage.objects for select
  using (bucket_id = 'produtos');

-- Permitir upload apenas via service_role (API routes)
create policy "service upload produtos"
  on storage.objects for insert
  with check (bucket_id = 'produtos');

create policy "service update produtos"
  on storage.objects for update
  using (bucket_id = 'produtos');
