
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

const SIGNED_URL_DURATION = 60 * 60; // 1 hora

export async function uploadOriginalPhoto(
  userId: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${userId}/${Date.now()}-original.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Erro no upload da fotografia:', uploadError);
    return null;
  }

  const { data, error: urlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(fileName, SIGNED_URL_DURATION);

  if (urlError) {
    console.error('Erro ao gerar URL assinada:', urlError);
  }

  return {
    path: fileName,
    url: data?.signedUrl ?? '',
  };
}

export async function uploadGeneratedImage(
  userId: string,
  pecaId: string,
  blob: Blob
): Promise<{ path: string; url: string } | null> {
  const fileName = `${userId}/${pecaId}/${Date.now()}-gerada.png`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, blob, {
      upsert: false,
      contentType: 'image/png',
    });

  if (uploadError) {
    console.error('Erro no upload da imagem gerada:', uploadError);
    return null;
  }

  const { data, error: urlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(fileName, SIGNED_URL_DURATION);

  if (urlError) {
    console.error('Erro ao gerar URL assinada:', urlError);
  }

  return {
    path: fileName,
    url: data?.signedUrl ?? '',
  };
}

export async function deleteStorageObject(
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Erro ao excluir imagem:', error);
    return false;
  }

  return true;
}

export async function getSignedUrl(
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_DURATION);

  if (error) {
    console.error('Erro ao recuperar imagem:', error);
    return '';
  }

  return data?.signedUrl ?? '';
}
