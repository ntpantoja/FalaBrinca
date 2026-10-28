-- Execute no Editor SQL do mesmo projeto Supabase do aplicativo.
create table if not exists public.learning_activities (
 id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null,
 description text not null,
 emoji text not null,
 color text not null default 'mint' check(color in ('mint','peach','lavender','sky','butter')),
 kind text not null check(kind in ('figures','association','sentence')),
 category text not null check(category in ('animals','objects','foods')),
 difficulty text not null check(difficulty in ('beginner','intermediate','advanced')),
 minutes integer not null default 3,
 published boolean not null default false,
 revision integer not null default 1 check(revision>0),
 sort_order integer not null default 1000,
 content jsonb not null,
 updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.learning_activities enable row level security;
revoke all on public.learning_activities from anon,authenticated;
grant all on public.learning_activities to service_role;
-- Ilustrações não contêm dados pessoais. Somente a API master permite upload.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('activity-media','activity-media',true,2097152,array['image/webp'])
on conflict(id) do nothing;
