begin;
create table if not exists public.access_passes (
 stripe_session_id text primary key, user_id uuid not null references auth.users(id) on delete restrict,
 payment_intent_id text not null unique, price_id text not null, starts_at timestamptz not null,
 ends_at timestamptz not null, revoked boolean not null default false
);
create index if not exists access_passes_user_idx on public.access_passes(user_id);
create table if not exists public.payment_receipts (
 source_id text primary key, user_id uuid not null references auth.users(id) on delete restrict,
 plan text not null check(plan in ('monthly','annual','yearly_pass')),
 amount_paid integer not null check(amount_paid >= 0), currency text not null check(currency='brl'),
 payment_intent_id text unique, paid_at timestamptz not null
);
create table if not exists public.payment_refunds (
 payment_intent_id text primary key, amount_refunded integer not null check(amount_refunded >= 0),
 fully_refunded boolean not null, updated_at timestamptz not null default now()
);
create table if not exists public.account_devices (
 user_id uuid not null references auth.users(id) on delete cascade, token_hash text not null,
 label text not null, created_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
 revoked boolean not null default false, primary key(user_id,token_hash)
);
create table if not exists public.account_visits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
 last_login_at timestamptz, login_count integer not null default 1
);
create table if not exists public.checkout_locks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lock_id uuid not null, locked_until timestamptz not null
);
create index if not exists payment_receipts_user_idx on public.payment_receipts(user_id);
create index if not exists subscriptions_user_period_idx on public.subscriptions(user_id,period_end desc);
create index if not exists account_devices_active_user_idx on public.account_devices(user_id) where not revoked;
alter table public.access_passes enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.account_devices enable row level security;
alter table public.account_visits enable row level security;
alter table public.checkout_locks enable row level security;
revoke all on public.access_passes,public.payment_receipts,public.payment_refunds,public.account_devices,public.account_visits,public.checkout_locks from anon,authenticated;
grant all on public.access_passes,public.payment_receipts,public.payment_refunds,public.account_devices,public.account_visits,public.checkout_locks to service_role;
create or replace function public.register_account_device(p_user_id uuid,p_token_hash text,p_label text)
returns text language plpgsql security definer set search_path=public as $$
declare existing public.account_devices; total integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
 select * into existing from account_devices where user_id=p_user_id and token_hash=p_token_hash;
 if found then
  if existing.revoked then return 'revoked'; end if;
  update account_devices set last_seen_at=now() where user_id=p_user_id and token_hash=p_token_hash;
  return 'ok';
 end if;
 select count(*) into total from account_devices where user_id=p_user_id and not revoked;
 if total >= 3 then return 'limit'; end if;
 insert into account_devices(user_id,token_hash,label) values(p_user_id,p_token_hash,left(p_label,80));
 return 'ok';
end; $$;
create or replace function public.record_account_visit(p_user_id uuid,p_login_at timestamptz)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into account_visits(user_id,last_login_at) values(p_user_id,p_login_at)
 on conflict(user_id) do update set last_seen_at=now(),
 login_count=account_visits.login_count + case when excluded.last_login_at > account_visits.last_login_at or (account_visits.last_login_at is null and excluded.last_login_at is not null) then 1 else 0 end,
 last_login_at=greatest(account_visits.last_login_at,excluded.last_login_at);
end; $$;
create or replace function public.acquire_checkout_lock(p_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,2));
 if exists(select 1 from checkout_locks where user_id=p_user_id and locked_until > now()) then return null; end if;
 result:=gen_random_uuid();
 insert into checkout_locks(user_id,lock_id,locked_until) values(p_user_id,result,now()+interval '2 minutes')
 on conflict(user_id) do update set lock_id=excluded.lock_id,locked_until=excluded.locked_until;
 return result;
end; $$;
create or replace function public.apply_pass_payment(p_event_id text,p_user_id uuid,p_session_id text,p_intent_id text,p_price_id text,p_paid_at timestamptz,p_ends_at timestamptz,p_amount integer)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_intent_id,3));
 insert into stripe_events(event_id) values(p_event_id) on conflict do nothing;
 if not found then return; end if;
 insert into payment_receipts(source_id,user_id,plan,amount_paid,currency,payment_intent_id,paid_at)
 values(p_session_id,p_user_id,'yearly_pass',p_amount,'brl',p_intent_id,p_paid_at) on conflict(source_id) do nothing;
 insert into access_passes(stripe_session_id,user_id,payment_intent_id,price_id,starts_at,ends_at,revoked)
 values(p_session_id,p_user_id,p_intent_id,p_price_id,p_paid_at,p_ends_at,
 exists(select 1 from payment_refunds where payment_intent_id=p_intent_id and fully_refunded))
 on conflict(stripe_session_id) do nothing;
end; $$;
create or replace function public.apply_payment_refund(p_intent_id text,p_amount integer,p_full boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_intent_id,3));
 insert into payment_refunds(payment_intent_id,amount_refunded,fully_refunded) values(p_intent_id,p_amount,p_full)
 on conflict(payment_intent_id) do update set amount_refunded=greatest(payment_refunds.amount_refunded,excluded.amount_refunded),
 fully_refunded=payment_refunds.fully_refunded or excluded.fully_refunded,updated_at=now();
 if p_full then update access_passes set revoked=true where payment_intent_id=p_intent_id; end if;
end; $$;
revoke all on function public.register_account_device(uuid,text,text),public.record_account_visit(uuid,timestamptz),public.acquire_checkout_lock(uuid),public.apply_pass_payment(text,uuid,text,text,text,timestamptz,timestamptz,integer),public.apply_payment_refund(text,integer,boolean) from public,anon,authenticated;
grant execute on function public.register_account_device(uuid,text,text),public.record_account_visit(uuid,timestamptz),public.acquire_checkout_lock(uuid),public.apply_pass_payment(text,uuid,text,text,text,timestamptz,timestamptz,integer),public.apply_payment_refund(text,integer,boolean) to service_role;
create or replace function public.master_customer_dashboard(p_master uuid,p_monthly text,p_annual text,p_page integer default 1,p_search text default '',p_filter text default 'all')
returns jsonb language sql security definer set search_path=public as $$
with customers as (
 select u.id,u.email,u.created_at,u.email_confirmed_at,u.last_sign_in_at,
 f.guardian_name,v.last_seen_at,coalesce(v.login_count,0) as tracked_logins,
 (select count(*) from account_devices d where d.user_id=u.id and not d.revoked) as devices,
 s.status as subscription_status,s.price_id,s.period_end,s.cancel_at_period_end,
 a.ends_at as pass_end,
 case when a.ends_at>now() then 'yearly_pass'
  when s.status in ('active','trialing') and to_timestamp(s.period_end)>now() then case when s.price_id=p_annual then 'annual' else 'monthly' end
  else null end as plan,
 exists(select 1 from payment_receipts r where r.user_id=u.id) as purchase_recorded
 from auth.users u
 left join family_profiles f on f.user_id=u.id
 left join account_visits v on v.user_id=u.id
 left join lateral(select * from subscriptions s where s.user_id=u.id and s.price_id in (p_monthly,p_annual)
  order by (s.status in ('active','trialing')) desc,s.period_end desc nulls last,s.event_created desc limit 1) s on true
 left join lateral(select ends_at from access_passes a where a.user_id=u.id and not a.revoked and a.ends_at>now() order by ends_at desc limit 1) a on true
 where u.id<>p_master
), classified as (
 select *, (plan is not null) as active,
 (purchase_recorded or (plan is not null and subscription_status is distinct from 'trialing')) as buyer,
 case when plan='yearly_pass' then 'active' else coalesce(subscription_status,'none') end as status
 from customers
), filtered as (
 select * from classified
 where (p_search='' or position(lower(p_search) in lower(coalesce(email,'')||' '||coalesce(guardian_name,'')))>0)
 and (p_filter='all' or (p_filter='no_purchase' and not buyer) or (p_filter='logged_no_purchase' and not buyer and last_sign_in_at is not null) or (p_filter='active' and active) or (p_filter='inactive' and not active))
), page_rows as (
 select * from filtered order by created_at desc,id limit 50 offset ((greatest(1,least(p_page,100000))-1)*50)
), receipt_totals as (
 select coalesce(sum(r.amount_paid),0) as gross,
 coalesce(sum(least(r.amount_paid,coalesce(f.amount_refunded,0))),0) as refunded,
 min(r.paid_at) as first_recorded_payment
 from payment_receipts r left join payment_refunds f using(payment_intent_id)
 where r.user_id<>p_master
)
select jsonb_build_object(
 'page',p_page,'pageSize',50,'total',(select count(*) from filtered),
 'customers',coalesce((select jsonb_agg(to_jsonb(page_rows)) from page_rows),'[]'::jsonb),
 'metrics',jsonb_build_object(
 'registered',(select count(*) from classified),
 'loggedIn',(select count(*) from classified where last_sign_in_at is not null),
 'buyers',(select count(*) from classified where buyer),
 'withoutPurchase',(select count(*) from classified where not buyer),
 'active',(select count(*) from classified where active),
 'monthly',(select count(*) from classified where plan='monthly' and subscription_status='active'),
 'annual',(select count(*) from classified where plan='annual' and subscription_status='active'),
 'yearlyPass',(select count(*) from classified where plan='yearly_pass'),
 'mrrCents',(select coalesce(sum(case when plan='monthly' and subscription_status='active' then 5000 when plan='annual' and subscription_status='active' then 3750 else 0 end),0) from classified),
 'passMonthlyEquivalentCents',(select count(*)*50000.0/12 from classified where plan='yearly_pass'),
 'grossCents',(select gross from receipt_totals),'refundedCents',(select refunded from receipt_totals),
 'netBeforeFeesCents',(select gross-refunded from receipt_totals),
 'firstRecordedPayment',(select first_recorded_payment from receipt_totals)
 ),'generatedAt',now()
);
$$;
revoke all on function public.master_customer_dashboard(uuid,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.master_customer_dashboard(uuid,text,text,integer,text,text) to service_role;
commit;
