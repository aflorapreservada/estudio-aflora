export interface LabelData {
  nome: string;
  tipo: string;
  medidas: string;
  cordao: string;
}

const LABEL_BG = '#786554';
const LABEL_TEXT = '#ffffff';

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

      if (showLabel && label.nome) {
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

function drawLabel(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  label: LabelData
) {
  const scale = canvasW / 1024;
  const padding = 24 * scale;
  const lineHeight = 20 * scale;
  const titleSize = 24 * scale;
  const bodySize = 14 * scale;

  const lines: { text: string; size: number; uppercase: boolean }[] = [
    { text: label.nome, size: titleSize, uppercase: true },
  ];

  if (label.tipo) lines.push({ text: label.tipo, size: bodySize, uppercase: false });
  if (label.medidas) lines.push({ text: `Medidas: ${label.medidas}`, size: bodySize, uppercase: false });
  if (label.cordao) lines.push({ text: `Cordão: ${label.cordao}`, size: bodySize, uppercase: false });

  const labelHeight = padding * 2 + lineHeight * lines.length;
  const labelY = canvasH - labelHeight;
  const labelWidth = Math.min(canvasW * 0.5, 460 * scale);
  const labelX = canvasW - labelWidth - padding;

  ctx.fillStyle = LABEL_BG;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

  ctx.fillStyle = LABEL_TEXT;
  ctx.textBaseline = 'top';

  let cursorY = labelY + padding;
  for (const line of lines) {
    ctx.font = `${line.uppercase ? 'bold' : 'normal'} ${line.size}px Inter, sans-serif`;
    const text = line.uppercase ? line.text.toUpperCase() : line.text;
    ctx.fillText(text, labelX + padding, cursorY);
    cursorY += lineHeight;
  }
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
