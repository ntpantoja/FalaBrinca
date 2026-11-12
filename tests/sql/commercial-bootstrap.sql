create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,created_at timestamptz default now(),email_confirmed_at timestamptz,last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql as $$select null::uuid$$;
create table public.stripe_events(event_id text primary key,created_at timestamptz default now());
create table public.subscriptions(stripe_subscription_id text primary key,user_id uuid references auth.users,status text,price_id text,period_end bigint,cancel_at_period_end boolean default false,event_created bigint,updated_at timestamptz default now());
create table public.family_profiles(user_id uuid primary key references auth.users,guardian_name text);
insert into auth.users(id,email,last_sign_in_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner@example.test',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','family@example.test',now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','another@example.test',now());
