import { CENARIOS } from '@/types';

interface StepCenarioProps {
  selectedCenario: string;
  onSelect: (value: string) => void;
  instrucoes: string;
  onInstrucoesChange: (value: string) => void;
}

export function StepCenario({
  selectedCenario,
  onSelect,
  instrucoes,
  onInstrucoesChange,
}: StepCenarioProps) {
  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-display font-medium text-clay-800">Cenário</h3>
        <p className="text-sm text-clay-500 mt-1">
          Escolha o ambiente e adicione instruções opcionais de iluminação e estilo.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {CENARIOS.map((c) => (
          <button
            key={c.value}
            onClick={() => onSelect(c.value)}
            className={`card p-4 text-left transition-all duration-200 ${
              selectedCenario === c.value
                ? 'border-2 border-clay-700 shadow-md bg-clay-100/40'
                : 'hover:border-clay-300'
            }`}
          >
            <p className="text-sm font-medium text-clay-800">{c.label}</p>
            <p className="text-xs text-clay-400 mt-1">{c.descricao}</p>
          </button>
        ))}
      </div>

      <div>
        <label className="label-field" htmlFor="instrucoes">
          Instruções adicionais (opcional)
        </label>
        <textarea
          id="instrucoes"
          value={instrucoes}
          onChange={(e) => onInstrucoesChange(e.target.value)}
          className="input-field min-h-[100px] resize-y"
          placeholder="Ex: Iluminação suente de manhã, fundo desfocado, estilo minimalista, fotografia de cima..."
        />
      </div>
    </div>
  );
}
