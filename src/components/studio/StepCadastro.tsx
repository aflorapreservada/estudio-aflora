
import { TIPOS_BIOJOIA } from '@/types';
import type { PecaInput } from '@/types';

interface StepCadastroProps {
  data: PecaInput;
  onChange: (data: Partial<PecaInput>) => void;
}

export function StepCadastro({ data, onChange }: StepCadastroProps) {
  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-display font-medium text-clay-800">
          Informações da joia
        </h3>
        <p className="text-sm text-clay-500 mt-1">
          Apenas as informações necessárias para orientar a geração
          da fotografia. Os detalhes da peça serão preservados
          a partir da imagem original.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label-field" htmlFor="nome">
            Nome ou código da peça *
          </label>
          <input
            id="nome"
            type="text"
            value={data.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            className="input-field"
            placeholder="Ex.: COL0003"
          />
        </div>

        <div>
          <label className="label-field" htmlFor="tipo">
            Tipo de joia
          </label>
          <select
            id="tipo"
            value={data.tipo}
            onChange={(e) => onChange({ tipo: e.target.value })}
            className="input-field"
          >
            <option value="">Selecione...</option>
            {TIPOS_BIOJOIA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="dimensoes">
            Tamanho da peça de resina
          </label>
          <input
            id="dimensoes"
            type="text"
            value={data.dimensoes}
            onChange={(e) => onChange({ dimensoes: e.target.value })}
            className="input-field"
            placeholder="Ex.: 3 cm de diâmetro ou 4 x 2 cm"
          />
          <p className="text-xs text-clay-400 mt-1">
            Informe o tamanho da resina, não o comprimento do cordão.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="observacoes">
            Descrição da peça
          </label>
          <textarea
            id="observacoes"
            value={data.observacoes}
            onChange={(e) =>
              onChange({ observacoes: e.target.value })
            }
            className="input-field min-h-[90px] resize-y"
            placeholder="Ex.: Resina transparente com flores naturais e corda ajustável."
          />
        </div>
      </div>
    </div>
  );
}
