-- Execute uma vez no Editor SQL do seu projeto Supabase.
-- Clientes só podem ler o próprio resumo; escrita financeira é exclusiva do servidor.
create table if not exists public.billing_customers (
 user_id uuid primary key references auth.users(id) on delete restrict,
 stripe_customer_id text not null unique,
 created_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
 stripe_subscription_id text primary key,
 user_id uuid not null references auth.users(id) on delete restrict,
 status text not null,
 price_id text,
 period_end bigint,
 cancel_at_period_end boolean not null default false,
 event_created bigint not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.stripe_events (
 event_id text primary key,
 created_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
revoke all on public.billing_customers, public.subscriptions, public.stripe_events from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.billing_customers, public.subscriptions, public.stripe_events to service_role;
drop policy if exists "Read own subscription" on public.subscriptions;
create policy "Read own subscription" on public.subscriptions for select to authenticated using ((select auth.uid())=user_id);
create or replace function public.apply_subscription_event(
 p_event_id text,p_event_created bigint,p_user_id uuid,p_subscription_id text,
 p_status text,p_price_id text,p_period_end bigint,p_cancel_at_period_end boolean
) returns void language plpgsql security definer set search_path=public as $$
begin
 insert into stripe_events(event_id) values(p_event_id) on conflict do nothing;
 if not found then return; end if;
 insert into subscriptions(stripe_subscription_id,user_id,status,price_id,period_end,cancel_at_period_end,event_created)
 values(p_subscription_id,p_user_id,p_status,p_price_id,p_period_end,p_cancel_at_period_end,p_event_created)
 on conflict(stripe_subscription_id) do update set
 status=excluded.status,price_id=excluded.price_id,period_end=excluded.period_end,
 cancel_at_period_end=excluded.cancel_at_period_end,event_created=excluded.event_created,updated_at=now()
 where subscriptions.event_created <= excluded.event_created;
end;
$$;
revoke all on function public.apply_subscription_event(text,bigint,uuid,text,text,text,bigint,boolean) from public,anon,authenticated;
grant execute on function public.apply_subscription_event(text,bigint,uuid,text,text,text,bigint,boolean) to service_role;

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
