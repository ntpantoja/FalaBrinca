-- Atualização: um perfil familiar por responsável, com autorização explícita.
create table if not exists public.family_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 guardian_name text not null check(char_length(guardian_name) between 2 and 80),
 child_first_name text not null check(char_length(child_first_name) between 2 and 40),
 consent_version text not null,
 consented_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.family_profiles enable row level security;
revoke all on public.family_profiles from anon, authenticated;
grant all on public.family_profiles to service_role;
