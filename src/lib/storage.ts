import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { storageReference, type StorageBucket } from '../../supabase/functions/_shared/storage-path';
export type { StorageBucket } from '../../supabase/functions/_shared/storage-path';

export const SIGNED_URL_DURATION = 3600;
const cache = new Map<string, { url: string; expires: number }>();
const pending = new Map<string, Promise<string>>();
supabase.auth.onAuthStateChange(() => { cache.clear(); pending.clear(); });

export async function resolveImageUrl(bucket: StorageBucket, path: string | null, legacyUrl: string | null = null, force = false): Promise<string> {
  const project = import.meta.env.VITE_SUPABASE_URL;
  const oldRef = legacyUrl && /^https?:\/\//i.test(legacyUrl)
    ? storageReference(legacyUrl, bucket, project) : null;
  const ref = storageReference(path, bucket, project) ?? oldRef;
  if (!ref) return legacyUrl ?? '';
  // Older generations were uploaded to pecas-fotos; the URL records their actual bucket.
  const candidates = ref.bucket === 'geracoes-imagens'
    ? [ref, ...(oldRef?.bucket === 'pecas-fotos' ? [{ bucket: oldRef.bucket, path: ref.path }] : [{ bucket: 'pecas-fotos' as const, path: ref.path }])]
    : [ref];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Faça login para acessar a fotografia privada.');
  const key = `${session.user.id}:${ref.bucket}:${ref.path}`;
  const cached = cache.get(key);
  if (!force && cached && cached.expires > Date.now()) return cached.url;
  const ongoing = pending.get(key);
  if (ongoing) return ongoing;
  const request = (async () => {
    const failures: string[] = [];
    for (const candidate of candidates) {
      const { data, error } = await supabase.storage.from(candidate.bucket).createSignedUrl(candidate.path, SIGNED_URL_DURATION);
      if (!error && data?.signedUrl) {
        if (force) cache.delete(key);
        cache.set(key, { url: data.signedUrl, expires: Date.now() + (SIGNED_URL_DURATION - 120) * 1000 });
        return data.signedUrl;
      }
      failures.push(`${candidate.bucket}/${candidate.path}: ${error?.message ?? 'URL não retornada'}`);
    }
    throw new Error(`Não foi possível acessar a fotografia. Verifique o caminho e a política SELECT do Storage. ${failures.join('; ')}`);
  })();
  pending.set(key, request);
  try { return await request; } finally { if (pending.get(key) === request) pending.delete(key); }
}

async function upload(bucket: StorageBucket, path: string, file: Blob) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(`Erro no upload: ${error.message}`);
  // A signing failure must not cause a second upload of an already stored file.
  let url = '';
  try { url = await resolveImageUrl(bucket, path); } catch (error) { console.error(error); }
  return { path, url };
}
export async function uploadOriginalPhoto(userId: string, file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  return upload('pecas-fotos', `${userId}/${crypto.randomUUID()}-original.${ext}`, file);
}
export async function uploadGeneratedImage(userId: string, pecaId: string, blob: Blob) {
  return upload('geracoes-imagens', `${userId}/${pecaId}/${crypto.randomUUID()}-gerada.png`, blob);
}
export async function getSignedUrl(path: string): Promise<string> {
  return resolveImageUrl('pecas-fotos', path);
}
export async function deleteStorageObject(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) console.error('Erro ao excluir imagem:', error);
  return !error;
}
