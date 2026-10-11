/*
# Estúdio Aflora — Storage bucket privado

## Visão geral
Cria um bucket privado no Supabase Storage para armazenar as fotografias
originais das biojoias e as imagens geradas pela IA.

## Mudanças
1. Cria bucket 'pecas-fotos' (privado)
2. Cria políticas de storage para que cada usuário só acesse seus próprios arquivos,
   organizados em pastas por user_id.

## Segurança
- O bucket é privado — arquivos não são publicamente acessíveis.
- Policies garantem que cada usuário só pode ler/escrever/deletar arquivos
  dentro de sua própria pasta (user_id/).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('pecas-fotos', 'pecas-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: usuários podem ver arquivos em sua própria pasta
DROP POLICY IF EXISTS "select_own_fotos" ON storage.objects;
CREATE POLICY "select_own_fotos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- INSERT: usuários podem enviar arquivos para sua própria pasta
DROP POLICY IF EXISTS "insert_own_fotos" ON storage.objects;
CREATE POLICY "insert_own_fotos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE: usuários podem atualizar arquivos em sua própria pasta
DROP POLICY IF EXISTS "update_own_fotos" ON storage.objects;
CREATE POLICY "update_own_fotos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE: usuários podem deletar arquivos em sua própria pasta
DROP POLICY IF EXISTS "delete_own_fotos" ON storage.objects;
CREATE POLICY "delete_own_fotos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pecas-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
