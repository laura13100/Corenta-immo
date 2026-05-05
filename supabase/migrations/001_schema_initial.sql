-- ============================================================
-- SCHEMA MVP — Corenta Immo
-- Migration 001 : schéma initial
-- ============================================================


-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Mise à jour automatique de updated_at sur chaque modification
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 1. PROFILS UTILISATEURS
-- Extension de auth.users (géré par Supabase Auth)
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'owner'
              check (role in ('owner', 'associate')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Création automatique du profil à l'inscription
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- 2. BIENS IMMOBILIERS
-- ============================================================

create table biens (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  nom             text not null,
  adresse         text,
  type            text
                  check (type in ('appartement', 'maison', 'garage', 'local', 'autre')),
  surface_m2      numeric(8,2)  check (surface_m2  > 0),
  nb_pieces       int           check (nb_pieces   > 0),
  date_achat      date,
  prix_achat      numeric(12,2) check (prix_achat  >= 0),
  regime_fiscal   text not null default 'micro-foncier'
                  check (regime_fiscal in (
                    'micro-foncier', 'reel', 'LMNP-micro', 'LMNP-reel'
                  )),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index biens_owner_id_idx on biens(owner_id);

create trigger biens_updated_at
  before update on biens
  for each row execute function set_updated_at();


-- ============================================================
-- 3. LOCATAIRES
-- ============================================================

create table locataires (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid not null references biens(id) on delete cascade,
  nom             text not null,
  email           text,
  telephone       text,
  date_entree     date,
  date_sortie     date,
  loyer_hc        numeric(10,2) check (loyer_hc       >= 0),
  charges         numeric(10,2) check (charges         >= 0) default 0,
  depot_garantie  numeric(10,2) check (depot_garantie  >= 0),
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint dates_coherentes check (
    date_sortie is null or date_sortie >= date_entree
  )
);

create index locataires_bien_id_idx on locataires(bien_id);

create trigger locataires_updated_at
  before update on locataires
  for each row execute function set_updated_at();


-- ============================================================
-- 4. RECETTES (loyers, charges récupérées, etc.)
-- ============================================================

create table recettes (
  id                  uuid primary key default gen_random_uuid(),
  bien_id             uuid not null references biens(id) on delete cascade,
  locataire_id        uuid references locataires(id) on delete set null,
  owner_id            uuid not null references profiles(id) on delete cascade,
  type                text not null default 'loyer'
                      check (type in ('loyer', 'charges', 'depot_garantie', 'autre')),
  montant             numeric(10,2) not null check (montant > 0),
  date_encaissement   date not null,
  description         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index recettes_bien_id_idx       on recettes(bien_id);
create index recettes_owner_id_idx      on recettes(owner_id);
create index recettes_date_idx          on recettes(date_encaissement);

create trigger recettes_updated_at
  before update on recettes
  for each row execute function set_updated_at();


-- ============================================================
-- 5. DÉPENSES / CHARGES
-- ============================================================

create table depenses (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid not null references biens(id) on delete cascade,
  owner_id        uuid not null references profiles(id) on delete cascade,
  categorie       text not null
                  check (categorie in (
                    'travaux',
                    'assurance',
                    'taxe_fonciere',
                    'gestion',
                    'copropriete',
                    'interets_emprunt',
                    'entretien',
                    'autre'
                  )),
  montant         numeric(10,2) not null check (montant > 0),
  date_depense    date not null,
  description     text,
  deductible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index depenses_bien_id_idx   on depenses(bien_id);
create index depenses_owner_id_idx  on depenses(owner_id);
create index depenses_date_idx      on depenses(date_depense);

create trigger depenses_updated_at
  before update on depenses
  for each row execute function set_updated_at();


-- ============================================================
-- 6. DOCUMENTS ET JUSTIFICATIFS
-- (les fichiers sont stockés dans Supabase Storage)
-- ============================================================

create table documents (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  bien_id         uuid references biens(id) on delete set null,
  recette_id      uuid references recettes(id) on delete set null,
  depense_id      uuid references depenses(id) on delete set null,
  nom             text not null,
  type_doc        text not null default 'autre'
                  check (type_doc in (
                    'quittance', 'facture', 'contrat', 'bail',
                    'assurance', 'taxe', 'photo', 'autre'
                  )),
  -- Chemin relatif dans le bucket Supabase Storage
  file_path       text not null,
  file_size       int  check (file_size > 0),
  mime_type       text,
  uploaded_at     timestamptz not null default now()
);

create index documents_owner_id_idx  on documents(owner_id);
create index documents_bien_id_idx   on documents(bien_id);
create index documents_recette_idx   on documents(recette_id);
create index documents_depense_idx   on documents(depense_id);


-- ============================================================
-- 7. ACCÈS PARTAGÉS (conjoint / associé)
-- ============================================================

create table acces_partages (
  id              uuid primary key default gen_random_uuid(),
  -- Propriétaire qui partage
  owner_id        uuid not null references profiles(id) on delete cascade,
  -- Personne invitée
  guest_id        uuid not null references profiles(id) on delete cascade,
  -- null = accès à tous les biens du propriétaire
  bien_id         uuid references biens(id) on delete cascade,
  niveau          text not null default 'lecture'
                  check (niveau in ('lecture', 'ecriture')),
  created_at      timestamptz not null default now(),
  constraint no_self_share   check (owner_id != guest_id),
  unique (owner_id, guest_id, bien_id)
);

create index acces_partages_owner_idx  on acces_partages(owner_id);
create index acces_partages_guest_idx  on acces_partages(guest_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit que ses propres données.
-- L'accès partagé est géré via acces_partages.
-- ============================================================

alter table profiles       enable row level security;
alter table biens          enable row level security;
alter table locataires     enable row level security;
alter table recettes       enable row level security;
alter table depenses       enable row level security;
alter table documents      enable row level security;
alter table acces_partages enable row level security;


-- -------- profiles --------

create policy "profiles: lecture propre profil"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: mise à jour propre profil"
  on profiles for update
  using (id = auth.uid());


-- -------- biens --------

-- Fonction helper : renvoie vrai si l'utilisateur courant a accès au bien
-- (propriétaire direct ou via acces_partages)
create or replace function user_can_access_bien(p_bien_id uuid)
returns boolean
language sql
security definer stable
as $$
  select exists (
    -- Propriétaire direct
    select 1 from biens b
    where b.id = p_bien_id
      and b.owner_id = auth.uid()
  )
  or exists (
    -- Accès partagé sur ce bien précis
    select 1 from acces_partages ap
    join biens b on b.id = p_bien_id
    where ap.guest_id  = auth.uid()
      and ap.owner_id  = b.owner_id
      and (ap.bien_id  = p_bien_id or ap.bien_id is null)
  );
$$;

create policy "biens: lecture"
  on biens for select
  using (user_can_access_bien(id));

create policy "biens: insertion"
  on biens for insert
  with check (owner_id = auth.uid());

create policy "biens: modification"
  on biens for update
  using (owner_id = auth.uid());

create policy "biens: suppression"
  on biens for delete
  using (owner_id = auth.uid());


-- -------- locataires --------

create policy "locataires: lecture"
  on locataires for select
  using (user_can_access_bien(bien_id));

create policy "locataires: insertion"
  on locataires for insert
  with check (
    exists (
      select 1 from biens b
      where b.id = bien_id and b.owner_id = auth.uid()
    )
  );

create policy "locataires: modification"
  on locataires for update
  using (
    exists (
      select 1 from biens b
      where b.id = bien_id and b.owner_id = auth.uid()
    )
  );

create policy "locataires: suppression"
  on locataires for delete
  using (
    exists (
      select 1 from biens b
      where b.id = bien_id and b.owner_id = auth.uid()
    )
  );


-- -------- recettes --------

create policy "recettes: lecture"
  on recettes for select
  using (user_can_access_bien(bien_id));

create policy "recettes: insertion"
  on recettes for insert
  with check (owner_id = auth.uid() and user_can_access_bien(bien_id));

create policy "recettes: modification"
  on recettes for update
  using (owner_id = auth.uid());

create policy "recettes: suppression"
  on recettes for delete
  using (owner_id = auth.uid());


-- -------- depenses --------

create policy "depenses: lecture"
  on depenses for select
  using (user_can_access_bien(bien_id));

create policy "depenses: insertion"
  on depenses for insert
  with check (owner_id = auth.uid() and user_can_access_bien(bien_id));

create policy "depenses: modification"
  on depenses for update
  using (owner_id = auth.uid());

create policy "depenses: suppression"
  on depenses for delete
  using (owner_id = auth.uid());


-- -------- documents --------

create policy "documents: lecture"
  on documents for select
  using (
    owner_id = auth.uid()
    or (bien_id is not null and user_can_access_bien(bien_id))
  );

create policy "documents: insertion"
  on documents for insert
  with check (owner_id = auth.uid());

create policy "documents: suppression"
  on documents for delete
  using (owner_id = auth.uid());


-- -------- acces_partages --------

create policy "acces: lecture"
  on acces_partages for select
  using (owner_id = auth.uid() or guest_id = auth.uid());

create policy "acces: insertion"
  on acces_partages for insert
  with check (owner_id = auth.uid());

create policy "acces: suppression"
  on acces_partages for delete
  using (owner_id = auth.uid());


-- ============================================================
-- STORAGE — bucket "documents"
-- À créer dans le dashboard Supabase ou via la CLI :
--   supabase storage create documents --public=false
--
-- Politique Storage recommandée :
--   - Upload  : utilisateur authentifié, dans son propre dossier {user_id}/*
--   - Lecture : utilisateur authentifié, sur ses propres fichiers
-- ============================================================
