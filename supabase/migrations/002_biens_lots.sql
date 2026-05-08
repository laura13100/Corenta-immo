-- ============================================================
-- Migration 002 : biens multi-types + table lots
-- À exécuter dans le SQL Editor du dashboard Supabase
-- ============================================================


-- 1. Ajouter la colonne kind à biens
--    'simple'   = bien indépendant
--    'immeuble' = parent contenant des lots
alter table biens add column if not exists kind text not null default 'simple'
  check (kind in ('simple', 'immeuble'));

-- 2. Rendre owner_id nullable temporairement (avant l'étape auth)
alter table biens alter column owner_id drop not null;


-- 3. Créer la table lots
create table if not exists lots (
  id            uuid primary key default gen_random_uuid(),
  immeuble_id   uuid not null references biens(id) on delete cascade,
  nom           text not null,
  type          text not null default 'appartement'
                check (type in ('appartement', 'maison', 'garage', 'local', 'autre')),
  regime_fiscal text not null default 'micro-foncier'
                check (regime_fiscal in ('micro-foncier', 'reel', 'LMNP-micro', 'LMNP-reel')),
  created_at    timestamptz not null default now()
);

create index if not exists lots_immeuble_id_idx on lots(immeuble_id);

alter table lots enable row level security;


-- 4. Politiques temporaires permissives (remplacées à l'étape auth)
--    Nécessaires pour tester sans utilisateur connecté

-- Sur biens : remplacer les policies actuelles basées sur auth.uid()
drop policy if exists "biens: lecture"      on biens;
drop policy if exists "biens: insertion"    on biens;
drop policy if exists "biens: modification" on biens;
drop policy if exists "biens: suppression"  on biens;

create policy "dev: biens all" on biens for all using (true) with check (true);

-- Sur lots
create policy "dev: lots all" on lots for all using (true) with check (true);
