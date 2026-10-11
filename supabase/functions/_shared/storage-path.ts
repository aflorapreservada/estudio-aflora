export const STORAGE_BUCKETS = ['pecas-fotos', 'modelos-referencias', 'geracoes-imagens'] as const;
export type StorageBucket = typeof STORAGE_BUCKETS[number];

// Preserve case and nested folders. Never treat an arbitrary external URL as Storage.
export function storageReference(value: string | null | undefined, bucket: StorageBucket, projectUrl: string): { bucket: StorageBucket; path: string } | null {
  if (!value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.origin !== new URL(projectUrl).origin) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);
    if (!match || !STORAGE_BUCKETS.includes(match[1] as StorageBucket)) return null;
    bucket = match[1] as StorageBucket;
    path = decodeURIComponent(match[2]);
  } else {
    path = path.replace(/^\/+/, '');
    if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
  }
  if (!path || path.split('/').some(part => part === '..' || part === '.')) throw new Error('Caminho de imagem inválido.');
  return { bucket, path };
}
