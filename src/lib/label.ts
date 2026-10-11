export interface LabelData {
  nome: string;
  tipo: string;
  medidas: string;
  cordao: string;
}

export async function renderImageWithLabel(
  imageUrl: string,
  label: LabelData,
  options?: { showLabel?: boolean; format?: 'png' | 'jpeg' }
): Promise<Blob | null> {
  const showLabel = options?.showLabel ?? true;
  const format = options?.format ?? 'png';

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);

      if (showLabel) {
        drawLabel(ctx, canvas.width, canvas.height, label);
      }

      canvas.toBlob(
        (blob) => resolve(blob),
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        format === 'jpeg' ? 0.95 : undefined
      );
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  label: LabelData
) {
  const scale = Math.min(canvasW, canvasH) / 1024;
  const margin = 20 * scale;
  const titleSize = 22 * scale;
  const bodySize = 13 * scale;
  const gap = 4 * scale;
  const lines = [
    { text: label.nome.trim(), size: titleSize, weight: '600' },
    { text: label.tipo.trim(), size: bodySize, weight: '400' },
    { text: label.medidas.trim(), size: bodySize, weight: '400' },
  ].filter(line => line.text);
  if (!lines.length) return;

  const totalHeight = lines.reduce((height, line) => height + line.size, 0)
    + gap * (lines.length - 1);
  let cursorY = canvasH - margin - totalHeight;
  const maxWidth = Math.min(340 * scale, canvasW - margin * 2);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 2 * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1 * scale;

  for (const line of lines) {
    ctx.font = `${line.weight} ${line.size}px Futura, "Century Gothic", Arial, sans-serif`;
    ctx.fillText(line.text, canvasW - margin, cursorY, maxWidth);
    cursorY += line.size + gap;
  }
  ctx.restore();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'peca';
}
