-- Read-only: run in Supabase SQL Editor; do not expose output publicly.
SELECT id, name, public FROM storage.buckets
WHERE id IN ('pecas-fotos', 'modelos-referencias', 'geracoes-imagens');
SELECT policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Exact paths and case; bucket prefix is tolerated by the application.
SELECT m.id, m.nome, m.user_id, m.retrato_path, o.name AS objeto_encontrado
FROM public.modelos m LEFT JOIN storage.objects o
ON o.bucket_id = 'modelos-referencias'
AND (o.name = m.retrato_path OR 'modelos-referencias/' || o.name = m.retrato_path);
SELECT g.id, g.imagem_path, o.bucket_id AS bucket_real
FROM public.geracoes g LEFT JOIN storage.objects o
ON o.bucket_id IN ('pecas-fotos', 'geracoes-imagens') AND o.name = g.imagem_path
WHERE g.imagem_path IS NOT NULL;
SELECT p.id, p.foto_original_path, o.name AS objeto_encontrado
FROM public.pecas p LEFT JOIN storage.objects o
ON o.bucket_id = 'pecas-fotos' AND o.name = p.foto_original_path;
