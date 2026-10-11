import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Plus, Save, Trash2, Move, Maximize2, RotateCcw } from 'lucide-react';
import type { Gabarito } from '@/types';

type Valores = Pick<Gabarito, 'nome' | 'tipo' | 'posicao_x' | 'posicao_y' | 'escala' | 'rotacao'>;
type Coordenadas = Pick<Valores, 'posicao_x' | 'posicao_y' | 'escala' | 'rotacao'>;

interface StepGabaritoProps {
  gabaritos: Gabarito[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (gabarito: Omit<Gabarito, 'id' | 'user_id' | 'criada_em' | 'e_padrao'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  fotoUrl: string | null;
  tipoJoia?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const inicial = (tipo: string): Valores => ({
  nome: '',
  tipo: tipo || 'personalizado',
  posicao_x: tipo.toLowerCase().includes('brinco') ? 47 : 50,
  posicao_y: tipo.toLowerCase().includes('brinco') ? 45 : 43,
  escala: tipo.toLowerCase().includes('brinco') ? 17 : 23,
  rotacao: 0,
});

function AreaInterativa({
  valor, onChange, brinco, interativo = false,
}: {
  valor: Coordenadas;
  onChange?: (v: Partial<Coordenadas>) => void;
  brinco: boolean;
  interativo?: boolean;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const gesto = useRef<null | {
    modo: 'mover' | 'tamanho';
    pointerId: number;
    x: number; y: number;
    inicio: Coordenadas;
    largura: number; altura: number;
  }>(null);

  function comecar(e: ReactPointerEvent<HTMLDivElement>, modo: 'mover' | 'tamanho') {
    if (!interativo || !onChange || !areaRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = areaRef.current.getBoundingClientRect();
    gesto.current = {
      modo, pointerId: e.pointerId, x: e.clientX, y: e.clientY,
      inicio: { ...valor }, largura: rect.width, altura: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function mover(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesto.current;
    if (!g || g.pointerId !== e.pointerId || !onChange) return;
    e.preventDefault();
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.modo === 'mover') {
      onChange({
        posicao_x: Math.round(clamp(g.inicio.posicao_x + dx / g.largura * 100, 0, 100) * 10) / 10,
        posicao_y: Math.round(clamp(g.inicio.posicao_y + dy / g.altura * 100, 0, 100) * 10) / 10,
      });
    } else {
      // escala é o lado do quadrado em % da largura da área.
      // arrastar na direção diagonal do canto inferior direito aumenta;
      // arrastar na direção oposta diminui, mantendo proporção 1:1.
      const delta = (dx + dy) / 2 / g.largura * 100 * 2;
      onChange({ escala: Math.round(clamp(g.inicio.escala + delta, 4, 75) * 10) / 10 });
    }
  }

  function terminar(e: ReactPointerEvent<HTMLDivElement>) {
    if (gesto.current?.pointerId === e.pointerId) gesto.current = null;
  }

  const lado = `${valor.escala}%`;
  return (
    <div
      ref={areaRef}
      className="relative w-full max-w-[430px] mx-auto aspect-[10/13] rounded-2xl overflow-hidden border border-clay-200 select-none"
      style={{ touchAction: 'none', background: '#dfd0c0' }}
    >
      <img src={brinco ? "/images/gabaritos/orelha.png" : "/images/gabaritos/torso.png"} alt={brinco ? "Escultura de referência para brinco" : "Escultura de referência para colar ou pingente"} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
      <div
        className="absolute border-2 border-[#80553c] bg-white/10"
        style={{
          left: `${valor.posicao_x}%`,
          top: `${valor.posicao_y}%`,
          width: lado,
          aspectRatio: '1 / 1',
          transform: `translate(-50%, -50%) rotate(${valor.rotacao}deg)`,
          boxShadow: '0 0 0 1px rgba(255,255,255,.7) inset',
        }}
      >
        {interativo && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label="Arrastar para mover a seleção"
              title="Arraste para posicionar"
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => comecar(e, 'mover')}
              onPointerMove={mover}
              onPointerUp={terminar}
              onPointerCancel={terminar}
            >
              <span className="rounded-full p-2 text-white bg-[#80553c] shadow-md pointer-events-none">
                <Move size={17} />
              </span>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Arrastar o canto para aumentar ou diminuir"
              title="Puxe para aumentar ou diminuir"
              className="absolute -bottom-3 -right-3 w-9 h-9 rounded-md bg-[#80553c] text-white border-2 border-white shadow-md flex items-center justify-center cursor-nwse-resize"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => comecar(e, 'tamanho')}
              onPointerMove={mover}
              onPointerUp={terminar}
              onPointerCancel={terminar}
            >
              <Maximize2 size={16} className="pointer-events-none" />
            </div>
          </>
        )}
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-[#f8efe5]/90 px-3 py-1 text-[11px] uppercase tracking-widest text-[#684a38] pointer-events-none">
        {brinco ? 'Brinco · orelha' : 'Colar / pingente · torso'}
      </span>
    </div>
  );
}

export function StepGabarito({
  gabaritos, selectedId, onSelect, onSave, onDelete, tipoJoia = '',
}: StepGabaritoProps) {
  const [editing, setEditing] = useState<Valores>(() => inicial(tipoJoia));
  const [modo, setModo] = useState<'novo' | 'existente'>('novo');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarRotacao, setMostrarRotacao] = useState(false);
  const brinco = tipoJoia.toLowerCase().includes('brinco');
  const selecionado = gabaritos.find((g) => g.id === selectedId) ?? null;

  useEffect(() => {
    if (selecionado) {
      setEditing({ nome: selecionado.nome, tipo: selecionado.tipo, posicao_x: selecionado.posicao_x, posicao_y: selecionado.posicao_y, escala: selecionado.escala, rotacao: selecionado.rotacao });
      setModo('existente');
    }
  }, [selectedId, gabaritos]);

  function novo() {
    setEditing(inicial(tipoJoia));
    setModo('novo');
    setErro('');
  }

  function escolher(id: string) {
    if (!id) { novo(); return; }
    const g = gabaritos.find((item) => item.id === id);
    if (!g) return;
    onSelect(id);
    setEditing({
      nome: g.nome, tipo: g.tipo,
      posicao_x: g.posicao_x, posicao_y: g.posicao_y,
      escala: g.escala, rotacao: g.rotacao,
    });
    setModo('existente');
    setErro('');
  }

  async function salvar() {
    if (!editing.nome.trim()) {
      setErro('Dê um nome ao gabarito.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      // onSave cria um novo registro; não modifica silenciosamente um gabarito existente.
      await onSave({ ...editing, nome: editing.nome.trim(), tipo: tipoJoia || editing.tipo });
      setModo('existente');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o gabarito.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-5">
        <h3 className="text-xl font-display font-medium text-clay-800">Posição da joia</h3>
        <p className="text-sm text-clay-500 mt-1">
          Arraste pelo centro para posicionar. Puxe o canto para ajustar o tamanho.
        </p>
      </div>

      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <select
            aria-label="Escolher gabarito"
            className="input-field flex-1 min-w-0"
            value={modo === 'novo' ? '' : (selecionado?.id ?? '')}
            onChange={(e) => escolher(e.target.value)}
          >
            <option value="">Novo gabarito</option>
            {gabaritos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
          <button type="button" onClick={novo} className="btn-secondary text-xs whitespace-nowrap" title="Criar novo gabarito">
            <Plus size={16} /> Novo
          </button>
        </div>

        <AreaInterativa
          brinco={brinco}
          interativo
          valor={editing}
          onChange={(v) => {
            setEditing((anterior) => ({ ...anterior, ...v }));
            // Alterar uma posição existente cria uma nova configuração ao salvar.
            if (modo === 'existente') setModo('novo');
          }}
        />
        <p className="text-xs text-center text-clay-500 mt-3">
          Centro: mover · Canto inferior direito: ajustar tamanho
        </p>

        <div className="card p-4 mt-5 space-y-4">
          <label className="block text-sm text-clay-700">
            Nome do gabarito
            <input
              className="input-field mt-1"
              value={editing.nome}
              onChange={(e) => setEditing((p) => ({ ...p, nome: e.target.value }))}
              placeholder={brinco ? 'Ex.: Brinco pequeno' : 'Ex.: Pingente centralizado'}
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="btn-ghost text-xs"
              onClick={() => { setEditing((p) => ({ ...p, ...inicial(tipoJoia), nome: p.nome })); setModo('novo'); }}>
              <RotateCcw size={14} /> Redefinir posição
            </button>
            <button type="button" className="text-xs text-clay-500 underline"
              onClick={() => setMostrarRotacao((v) => !v)}>
              {mostrarRotacao ? 'Ocultar rotação' : 'Rotação (opcional)'}
            </button>
          </div>
          {mostrarRotacao && (
            <label className="block text-xs text-clay-600">
              Rotação: {editing.rotacao}°
              <input className="w-full accent-clay-700" type="range" min={-180} max={180}
                value={editing.rotacao}
                onChange={(e) => { setEditing((p) => ({ ...p, rotacao: Number(e.target.value) })); setModo('novo'); }} />
            </label>
          )}
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-between items-center gap-3">
            {modo === 'existente' && selecionado && !selecionado.e_padrao ? (
              <button type="button" className="btn-ghost text-xs text-red-600"
                onClick={async () => { await onDelete(selecionado.id); novo(); }}>
                <Trash2 size={14} /> Excluir
              </button>
            ) : <span />}
            <button type="button" className="btn-primary" disabled={salvando} onClick={salvar}>
              <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar como novo gabarito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
