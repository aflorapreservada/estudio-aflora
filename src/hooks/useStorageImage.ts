import { useEffect, useState, useCallback, useRef } from 'react';
import { resolveImageUrl, type StorageBucket } from '@/lib/storage';

export function useStorageImage(bucket: StorageBucket, path: string | null, legacyUrl: string | null) {
  const [state, setState] = useState({ url: '', error: '' });
  const [revision, setRevision] = useState(0);
  const retries = useRef(0);
  const identity = `${bucket}:${path}:${legacyUrl}`;
  useEffect(() => { retries.current = 0; }, [identity]);
  useEffect(() => {
    let active = true;
    const load = async (force = false) => {
      try {
        const url = await resolveImageUrl(bucket, path, legacyUrl, force);
        if (active) setState({ url, error: '' });
      } catch (error) {
        if (active) setState({ url: '', error: error instanceof Error ? error.message : 'Erro ao carregar fotografia.' });
      }
    };
    setState({ url: '', error: '' });
    void load(revision > 0);
    const timer = window.setInterval(() => { void load(true); }, 50 * 60 * 1000);
    const resume = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [bucket, path, legacyUrl, revision]);
  const onError = useCallback(() => {
    if (retries.current++ === 0) setRevision(v => v + 1);
    else setState({ url: '', error: 'Não foi possível exibir a fotografia. Verifique o arquivo e as permissões.' });
  }, []);
  return { ...state, onError };
}
