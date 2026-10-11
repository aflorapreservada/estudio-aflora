import { useStorageImage } from '@/hooks/useStorageImage';
import { resolveImageUrl } from '@/lib/storage';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  Download,
  Eye,
  EyeOff,
  Tag,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import type { Geracao, Peca } from '@/types';
import { CENARIOS } from '@/types';
import {
  renderImageWithLabel,
  drawLabel,
  downloadBlob,
  sanitizeFilename,
  type LabelData,
} from '@/lib/label';

interface StepGeracaoProps {
  peca: Peca | null;
  geracoes: Geracao[];
  onGenerate: (tipo: 'editorial' | 'modelo') => Promise<void>;
  generating: boolean;
  generateError: string | null;
  hasFoto: boolean;
  hasNome: boolean;
  canGenerateModelo: boolean;
}

export function StepGeracao({
  peca,
  geracoes,
  onGenerate,
  generating,
  generateError,
  hasFoto,
  hasNome,
  canGenerateModelo,
}: StepGeracaoProps) {
  const editorialGeracoes = geracoes.filter((g) => g.tipo_geracao === 'editorial');
  const modeloGeracoes = geracoes.filter((g) => g.tipo_geracao === 'modelo');

  const canGenerate = hasFoto && hasNome && !generating;

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-display font-medium text-clay-800">Geração de fotografias</h3>
        <p className="text-sm text-clay-500 mt-1">
          Produza duas fotografias independentes: a peça em destaque e o modelo usando a peça.
        </p>
      </div>

      {!hasFoto && (
        <div className="mb-6 flex items-start gap-3 text-sm text-clay-600 bg-sand-100 border border-clay-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Envie a fotografia original na Etapa 1 antes de gerar.</span>
        </div>
      )}
      {!hasNome && (
        <div className="mb-6 flex items-start gap-3 text-sm text-clay-600 bg-sand-100 border border-clay-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Cadastre o nome da peça na Etapa 2 antes de gerar.</span>
        </div>
      )}

      {/* Aviso sobre fidelidade */}
      <div className="mb-6 text-xs text-clay-500 bg-sand-100/60 border border-clay-100 px-4 py-3 rounded-sm leading-relaxed">
        A fidelidade absoluta não é garantida por IA generativa. As imagens preservam a referência visual da peça original,
        mas podem conter pequenas variações. Você poderá revisar antes de aprovar.
      </div>

      {/* Botões de geração */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <GenerateCard
          title="Fotografia editorial da peça"
          description="Fotografia comercial sofisticada da biojoia com iluminação e cenário escolhidos."
          icon={<ImageIcon className="w-5 h-5" />}
          onGenerate={() => onGenerate('editorial')}
          disabled={!canGenerate}
          generating={generating}
        />
        <GenerateCard
          title="Modelo usando a peça"
          description="Fotografia realista do modelo virtual escolhido usando a biojoia na posição do gabarito."
          icon={<Sparkles className="w-5 h-5" />}
          onGenerate={() => onGenerate('modelo')}
          disabled={!canGenerate || !canGenerateModelo}
          generating={generating}
          extraWarning={!canGenerateModelo ? 'Selecione um modelo na Etapa 4.' : undefined}
        />
      </div>

      {generateError && (
        <div className="mb-6 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

      {/* Resultados */}
      {editorialGeracoes.length > 0 && (
        <GeracaoGroup
          title="Fotografias editoriais"
          geracoes={editorialGeracoes}
          peca={peca}
        />
      )}
      {modeloGeracoes.length > 0 && (
        <GeracaoGroup
          title="Modelo usando a peça"
          geracoes={modeloGeracoes}
          peca={peca}
        />
      )}
    </div>
  );
}

function GenerateCard({
  title,
  description,
  icon,
  onGenerate,
  disabled,
  generating,
  extraWarning,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onGenerate: () => void;
  disabled: boolean;
  generating: boolean;
  extraWarning?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-clay-100 text-clay-700 shrink-0">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-clay-800">{title}</p>
          <p className="text-xs text-clay-500 mt-1 leading-relaxed">{description}</p>
          {extraWarning && (
            <p className="text-xs text-accent-700 mt-2">{extraWarning}</p>
          )}
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={disabled}
        className="btn-primary w-full"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> Gerar fotografia
          </>
        )}
      </button>
    </div>
  );
}

function GeracaoGroup({
  title,
  geracoes,
  peca,
}: {
  title: string;
  geracoes: Geracao[];
  peca: Peca | null;
}) {
  return (
    <div className="mb-8">
      <h4 className="text-sm tracking-editorial uppercase text-clay-600 font-medium mb-4">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {geracoes.map((g) => (
          <GeracaoCard key={g.id} geracao={g} peca={peca} />
        ))}
      </div>
    </div>
  );
}

function GeracaoCard({ geracao, peca }: { geracao: Geracao; peca: Peca | null }) {
  const image = useStorageImage('geracoes-imagens', geracao.imagem_path, geracao.imagem_url);
  const [showLabel, setShowLabel] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [labeledUrl, setLabeledUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const labelData: LabelData = useMemo(() => ({
    nome: peca?.nome ?? '',
    tipo: peca?.tipo ?? '',
    medidas: peca?.dimensoes ?? '',
    cordao: [peca?.cordao_tipo, peca?.cordao_comprimento].filter(Boolean).join(' · ') ?? '',
  }), [peca?.nome, peca?.tipo, peca?.dimensoes, peca?.cordao_tipo, peca?.cordao_comprimento]);

  const cenarioLabel = CENARIOS.find((c) => c.value === geracao.cenario)?.label ?? geracao.cenario;
  const dataFormatada = new Date(geracao.criada_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Render label overlay on canvas for preview
  useEffect(() => {
    setLabeledUrl(null);
    if (!image.url || !canvasRef.current) return;
    let active = true;
    let objectUrl: string | null = null;
    setLabeledUrl(null);
    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!active) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      if (showLabel) {
        drawLabel(ctx, canvas.width, canvas.height, labelData);
      }
      canvas.toBlob((blob) => {
        if (blob && active) { objectUrl = URL.createObjectURL(blob); setLabeledUrl(objectUrl); }
      }, 'image/png');
    };
    img.onerror = image.onError;
    img.src = image.url;
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [image.url, image.onError, showLabel, labelData]);

  const handleDownload = async (withLabel: boolean, format: 'png' | 'jpeg') => {
    if (!image.url || !peca) return;
    setDownloading(true);
    try {
    const freshUrl = await resolveImageUrl('geracoes-imagens', geracao.imagem_path, geracao.imagem_url);
    const blob = await renderImageWithLabel(freshUrl, labelData, {
      showLabel: withLabel,
      format,
    });
    if (blob) {
      const baseName = sanitizeFilename(peca.nome);
      const suffix = geracao.tipo_geracao === 'editorial' ? 'editorial' : 'modelo';
      const labelSuffix = withLabel ? 'com-etiqueta' : 'sem-etiqueta';
      downloadBlob(blob, `${baseName}-${suffix}-${labelSuffix}.${format}`);
    }
    } catch { image.onError(); } finally { setDownloading(false); }
  };

  if (geracao.status === 'pendente' || geracao.status === 'processando') {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-clay-500 animate-spin mb-3" />
        <p className="text-sm text-clay-600">Gerando fotografia...</p>
        <p className="text-xs text-clay-400 mt-1">{dataFormatada}</p>
      </div>
    );
  }

  if (geracao.status === 'erro') {
    return (
      <div className="card p-6 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro na geração</p>
            <p className="text-xs text-red-600 mt-1">{geracao.erro_mensagem}</p>
            <p className="text-xs text-clay-400 mt-2">{dataFormatada}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden group">
      {/* Imagem */}
      <div className="relative bg-sand-100 overflow-hidden">
        {labeledUrl && showLabel ? (
          <img src={labeledUrl} alt="Resultado" className="w-full h-auto object-contain max-h-[500px]" />
        ) : image.url ? (
          <img onError={image.onError} src={image.url} alt="Resultado" className="w-full h-auto object-contain max-h-[500px]" />
        ) : null}
        {image.error && <p role="alert" className="text-xs text-red-700">{image.error}</p>}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controles */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-clay-400">{cenarioLabel} · {dataFormatada}</p>
            {geracao.modelo_ia && (
              <p className="text-[10px] text-clay-300 mt-0.5">Modelo: {geracao.modelo_ia}</p>
            )}
          </div>
          <button
            onClick={() => setShowLabel(!showLabel)}
            className={`btn-ghost text-xs ${showLabel ? 'text-clay-800' : ''}`}
            title={showLabel ? 'Ocultar etiqueta' : 'Mostrar etiqueta'}
          >
            {showLabel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showLabel ? 'Ocultar etiqueta' : 'Mostrar etiqueta'}
          </button>
        </div>

        {/* Downloads */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-clay-100">
          <button
            onClick={() => handleDownload(true, 'png')}
            disabled={downloading}
            className="btn-secondary text-xs flex-1 min-w-[140px]"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
            Com etiqueta · PNG
          </button>
          <button
            onClick={() => handleDownload(false, 'png')}
            disabled={downloading}
            className="btn-secondary text-xs flex-1 min-w-[140px]"
          >
            <Download className="w-3.5 h-3.5" /> Sem etiqueta · PNG
          </button>
          <button
            onClick={() => handleDownload(true, 'jpeg')}
            disabled={downloading}
            className="btn-ghost text-xs"
          >
            JPEG
          </button>
        </div>
      </div>
    </div>
  );
}
