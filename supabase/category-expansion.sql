-- Amplia as categorias sem remover cards, contas ou assinaturas.
begin;
alter table public.learning_activities drop constraint if exists learning_activities_category_check;
alter table public.learning_activities add constraint learning_activities_category_check check(category in ('animals','objects','foods','colors','emotions','transports','actions','nature'));
-- Reclassifica somente o material inicial que nunca foi editado.
update public.learning_activities set category='transports',revision=revision+1 where id='transportes' and category='objects' and revision=1;
update public.learning_activities set category='nature',revision=revision+1 where id in ('natureza','clima','frases-natureza') and category='objects' and revision=1;
update public.learning_activities set category='emotions',revision=revision+1 where id in ('emocoes','frases-carinho') and category='objects' and revision=1;
update public.learning_activities set category='actions',revision=revision+1 where id in ('frases-parque','frases-rotina','frases-pedidos') and category='objects' and revision=1;
commit;
