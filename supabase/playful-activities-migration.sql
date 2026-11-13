-- Execute no Editor SQL do mesmo Supabase. Preserva atividades, imagens e gravações existentes.
begin;
alter table public.learning_activities drop constraint if exists learning_activities_kind_check;
alter table public.learning_activities add constraint learning_activities_kind_check
 check(kind in ('figures','association','sentence','puzzle','memory'));
commit;
