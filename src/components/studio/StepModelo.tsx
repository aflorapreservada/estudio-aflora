import { User, Users } from 'lucide-react';
import type { Modelo } from '@/types';

interface StepModeloProps {
  modelos: Modelo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StepModelo({ modelos, selectedId, onSelect }: StepModeloProps) {
  const femininos = modelos.filter((m) => m.genero === 'feminino');
  const masculinos = modelos.filter((m) => m.genero === 'masculino');

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-display font-medium text-clay-800">Modelos virtuais</h3>
        <p className="text-sm text-clay-500 mt-1">
          Selecione o modelo que utilizará a biojoia na fotografia.
        </p>
      </div>

      <div className="space-y-8">
        <ModeloGroup
          title="Modelos femininos"
          icon={<Users className="w-4 h-4" />}
          modelos={femininos}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <ModeloGroup
          title="Modelos masculinos"
          icon={<User className="w-4 h-4" />}
          modelos={masculinos}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function ModeloGroup({
  title,
  icon,
  modelos,
  selectedId,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  modelos: Modelo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-clay-500">{icon}</span>
        <h4 className="text-sm tracking-editorial uppercase text-clay-600 font-medium">{title}</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {modelos.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`cursor-pointer card p-3 transition-all duration-200 ${
              selectedId === m.id ? 'border-2 border-clay-700 shadow-md' : 'hover:border-clay-300'
            }`}
          >
            <div className="aspect-square bg-sand-100 rounded-sm mb-3 overflow-hidden flex items-center justify-center">
              {m.retrato_url ? (
                <img src={m.retrato_url} alt={m.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-clay-300">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <p className="text-sm font-display font-medium text-clay-800 text-center">{m.nome}</p>
            <p className="text-xs text-clay-400 text-center mt-0.5">{m.tom_pele}</p>
            <p className="text-[10px] text-clay-400 text-center mt-1 line-clamp-2">{m.descricao}</p>
            {m.e_padrao && (
              <p className="text-[10px] tracking-wide-sm text-clay-400 text-center mt-2">Modelo padrão</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
