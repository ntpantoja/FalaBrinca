-- Atualiza somente o relatório master: R$ 20/mês e R$ 200/ano.
-- IDs legados preservam a referência anterior de R$ 50/mês e R$ 450/ano.
-- Não altera contas, pagamentos nem assinaturas no Stripe. Pode repetir.
begin;
create or replace function public.master_customer_dashboard(p_master uuid,p_monthly text,p_annual text,p_page integer default 1,p_search text default '',p_filter text default 'all')
returns jsonb language sql security definer set search_path=public as $$
with customers as (
 select u.id,u.email,u.created_at,u.email_confirmed_at,u.last_sign_in_at,
 f.guardian_name,v.last_seen_at,coalesce(v.login_count,0) as tracked_logins,
 (select count(*) from account_devices d where d.user_id=u.id and not d.revoked) as devices,
 s.status as subscription_status,s.price_id,s.period_end,s.cancel_at_period_end,
 a.ends_at as pass_end,
 case when a.ends_at>now() then 'yearly_pass'
  when s.status in ('active','trialing') and to_timestamp(s.period_end)>now() then case when s.price_id=any(string_to_array(p_annual,',')) then 'annual' else 'monthly' end
  else null end as plan,
 exists(select 1 from payment_receipts r where r.user_id=u.id) as purchase_recorded
 from auth.users u
 left join family_profiles f on f.user_id=u.id
 left join account_visits v on v.user_id=u.id
 left join lateral(select * from subscriptions s where s.user_id=u.id and s.price_id=any(string_to_array(p_monthly||','||p_annual,','))
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
 'mrrCents',(select coalesce(sum(case when plan='monthly' and subscription_status='active' then case when price_id=split_part(p_monthly,',',1) then 2000 else 5000 end when plan='annual' and subscription_status='active' then case when price_id=split_part(p_annual,',',1) then 20000.0/12 else 45000.0/12 end else 0 end),0) from classified),
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
