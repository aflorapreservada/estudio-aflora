import type { ImgHTMLAttributes } from 'react';
import { useStorageImage } from '@/hooks/useStorageImage';
import type { StorageBucket } from '@/lib/storage';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & {
  bucket: StorageBucket;
  path: string | null;
  legacyUrl: string | null;
};
export function StorageImage({ bucket, path, legacyUrl, ...props }: Props) {
  const image = useStorageImage(bucket, path, legacyUrl);
  if (image.error) return <span role="alert" className="text-xs text-red-700">{image.error}</span>;
  if (!image.url) return <span className="text-xs text-clay-400">Carregando fotografia…</span>;
  return <img {...props} src={image.url} onError={image.onError} />;
}
