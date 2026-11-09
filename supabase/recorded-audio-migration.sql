-- Execute uma vez no Editor SQL do Supabase.
-- Áudios de conteúdo são públicos. Não grave dados pessoais ou vozes de crianças.
-- Upload somente pela API autenticada do master (service_role), sem políticas públicas de escrita.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('activity-audio','activity-audio',true,3145728,array['audio/webm','audio/mp4','audio/ogg'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;
