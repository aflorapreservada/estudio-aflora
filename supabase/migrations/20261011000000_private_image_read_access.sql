/* Adds SELECT only. No public buckets, deletes, uploads or table recreation.
   Existing policies are additive in Postgres; audit broad policies before applying.
   Model visibility follows the modelos table RLS, including future client-owned rows.
*/
BEGIN;
CREATE POLICY "aflora_read_model_references" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'modelos-referencias'
  AND EXISTS (
    SELECT 1 FROM public.modelos m
    WHERE (m.user_id IS NULL OR m.user_id = auth.uid())
      AND (m.retrato_path = storage.objects.name
        OR m.retrato_path = 'modelos-referencias/' || storage.objects.name)
  )
);
CREATE POLICY "aflora_read_own_generated_images" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'geracoes-imagens'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
COMMIT;
