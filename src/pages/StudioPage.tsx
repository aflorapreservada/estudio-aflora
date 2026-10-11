import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/lib/supabase';

import { useAuth } from '@/contexts/AuthContext';

import { uploadOriginalPhoto } from '@/lib/storage';

import {

  GABARITOS_PADRAO,

  type Peca,

  type PecaInput,

  type Gabarito,

  type GabaritoInput,

  type Modelo,

  type Geracao,

  type TipoGeracao,


} from '@/types';

import { CENARIOS } from '@/types';



import { StepFoto } from '@/components/studio/StepFoto';

import { StepCadastro } from '@/components/studio/StepCadastro';

import { StepGabarito } from '@/components/studio/StepGabarito';

import { StepModelo } from '@/components/studio/StepModelo';


import { StepGeracao } from '@/components/studio/StepGeracao';



import { Check, ChevronRight, ChevronLeft } from 'lucide-react';



const STEPS = [

  { num: 1, label: 'Fotografia' },

  { num: 2, label: 'Cadastro' },

  { num: 3, label: 'Gabarito' },

  { num: 4, label: 'Modelo' },


  { num: 6, label: 'Gerar' },

];



interface StudioPageProps {

  editingPeca: Peca | null;

  onClearEditing: () => void;

}



export function StudioPage({ editingPeca, onClearEditing }: StudioPageProps) {

  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);



  // Peca data

  const [pecaData, setPecaData] = useState<PecaInput>({

    nome: '', tipo: '', dimensoes: '', material: '',

    cordao_tipo: '', cordao_comprimento: '', observacoes: '',

    foto_original_path: null, foto_original_url: null,

  });

  const [savedPeca, setSavedPeca] = useState<Peca | null>(null);



  // Gabaritos

  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);

  const [selectedGabaritoId, setSelectedGabaritoId] = useState<string | null>(null);



  // Modelos

  const [modelos, setModelos] = useState<Modelo[]>([]);

  const [selectedModeloId, setSelectedModeloId] = useState<string | null>(null);



  // Cenario

  const [selectedCenario, setSelectedCenario] = useState<string>('estudio');

  const [instrucoes, setInstrucoes] = useState('');



  // Geracoes

  const [geracoes, setGeracoes] = useState<Geracao[]>([]);

  const [generating, setGenerating] = useState(false);

  const [generateError, setGenerateError] = useState<string | null>(null);



  // Load existing peca for editing

  useEffect(() => {

    if (editingPeca) {

      setSavedPeca(editingPeca);

      setPecaData({

        nome: editingPeca.nome, tipo: editingPeca.tipo,

        dimensoes: editingPeca.dimensoes, material: editingPeca.material,

        cordao_tipo: editingPeca.cordao_tipo, cordao_comprimento: editingPeca.cordao_comprimento,

        observacoes: editingPeca.observacoes,

        foto_original_path: editingPeca.foto_original_path,

        foto_original_url: editingPeca.foto_original_url,

      });

      setCurrentStep(1);

      loadGeracoes(editingPeca.id);

    }

  }, [editingPeca]);



  // Load gabaritos and modelos on mount

  useEffect(() => {

    if (!user) return;

    loadGabaritos();

    loadModelos();

  }, [user]);



  // Ensure default gabaritos exist for this user

  const ensureDefaultGabaritos = useCallback(async () => {

    if (!user) return;

    const { data: existing } = await supabase

      .from('gabaritos')

      .select('*')

      .eq('user_id', user.id)

      .eq('e_padrao', true);



    if (existing && existing.length === 0) {

      const inserts = GABARITOS_PADRAO.map((g) => ({

        ...g,

        user_id: user.id,

        e_padrao: true,

      }));

      const { data: inserted } = await supabase

        .from('gabaritos')

        .insert(inserts)

        .select();

      if (inserted) {

        setGabaritos(inserted);

        if (inserted[0]) setSelectedGabaritoId(inserted[0].id);

      }

    } else if (existing && existing.length > 0) {

      setGabaritos(existing);

      if (existing[0]) setSelectedGabaritoId(existing[0].id);

    }

  }, [user]);



  useEffect(() => {

    ensureDefaultGabaritos();

  }, [ensureDefaultGabaritos]);



  const loadGabaritos = async () => {

    if (!user) return;

    const { data } = await supabase

      .from('gabaritos')

      .select('*')

      .eq('user_id', user.id)

      .order('criada_em', { ascending: true });

    if (data) setGabaritos(data);

  };



  const loadModelos = async () => {

    const { data } = await supabase

      .from('modelos')

      .select('*')

      .or(`user_id.is.null,user_id.eq.${user?.id ?? ''}`)

      .order('criada_em', { ascending: true });

    if (data) setModelos(data);

  };



  const loadGeracoes = async (pecaId: string) => {

    const { data } = await supabase

      .from('geracoes')

      .select('*')

      .eq('peca_id', pecaId)

      .order('criada_em', { ascending: false });

    if (data) setGeracoes(data);

  };



  // Save peca to DB

  const savePeca = async (): Promise<Peca | null> => {

    if (!user) return null;

    if (savedPeca) {

      const { data, error } = await supabase

        .from('pecas')

        .update({

          nome: pecaData.nome, tipo: pecaData.tipo,

          dimensoes: pecaData.dimensoes, material: pecaData.material,

          cordao_tipo: pecaData.cordao_tipo, cordao_comprimento: pecaData.cordao_comprimento,

          observacoes: pecaData.observacoes,

          foto_original_path: pecaData.foto_original_path,

          foto_original_url: pecaData.foto_original_url,

        })

        .eq('id', savedPeca.id)

        .select()

        .maybeSingle();

      if (data) { setSavedPeca(data); return data; }

      if (error) console.error('Erro ao atualizar peça:', error);

      return null;

    }

    const { data, error } = await supabase

      .from('pecas')

      .insert({ ...pecaData })

      .select()

      .maybeSingle();

    if (data) { setSavedPeca(data); return data; }

    if (error) console.error('Erro ao criar peça:', error);

    return null;

  };



  const handleFotoUpload = async (file: File) => {

    if (!user) return;

    const result = await uploadOriginalPhoto(user.id, file);

    if (result) {

      setPecaData((prev) => ({

        ...prev,

        foto_original_path: result.path,

        foto_original_url: result.url,

      }));

    }

  };



  const handleFotoClear = () => {

    setPecaData((prev) => ({

      ...prev,

      foto_original_path: null,

      foto_original_url: null,

    }));

  };



  const handleSaveGabarito = async (

    gabarito: Omit<GabaritoInput, 'e_padrao'> & { e_padrao?: boolean }

  ) => {

    if (!user) return;

    const { data } = await supabase

      .from('gabaritos')

      .insert({

        ...gabarito,

        user_id: user.id,

        e_padrao: false,

      })

      .select()

      .maybeSingle();

    if (data) {

      setGabaritos((prev) => [...prev, data]);

      setSelectedGabaritoId(data.id);

    }

  };



  const handleDeleteGabarito = async (id: string) => {

    await supabase.from('gabaritos').delete().eq('id', id);

    setGabaritos((prev) => prev.filter((g) => g.id !== id));

    if (selectedGabaritoId === id) setSelectedGabaritoId(null);

  };



  const handleGenerate = async (tipo: TipoGeracao) => {

    setGenerateError(null);

    if (!user) return;



    // Ensure peca is saved

    const peca = await savePeca();

    if (!peca) {

      setGenerateError('Erro ao salvar a peça. Tente novamente.');

      return;

    }



    setGenerating(true);



    const cenarioObj = CENARIOS.find((c) => c.value === selectedCenario);

    const gabarito = gabaritos.find((g) => g.id === selectedGabaritoId);

    const modelo = modelos.find((m) => m.id === selectedModeloId);



    // Insert generation record

    const { data: genRecord, error: genError } = await supabase

      .from('geracoes')

      .insert({

        peca_id: peca.id,

        user_id: user.id,

        tipo_geracao: tipo,

        modelo_id: tipo === 'modelo' ? selectedModeloId : null,

        cenario: cenarioObj?.label ?? selectedCenario,

        instrucoes,

        gabarito_id: selectedGabaritoId,

        status: 'processando',

      })

      .select()

      .maybeSingle();



    if (genError || !genRecord) {

      setGenerateError('Erro ao registrar geração.');

      setGenerating(false);

      return;

    }



    // Call edge function

    const { data: { session }, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError || !session?.access_token) {
  throw new Error('Sessão expirada. Faça login novamente.');
}

    try {

      const response = await fetch(

        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,

        {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
  },

  body: JSON.stringify({
    pecaId: peca.id,
    geracaoId: genRecord.id,
    tipoGeracao: tipo,
    fotoOriginalUrl: peca.foto_original_url,
    pecaNome: peca.nome,
    pecaTipo: peca.tipo,
    pecaDimensoes: peca.dimensoes,
    pecaMaterial: peca.material,
    cordao: [peca.cordao_tipo, peca.cordao_comprimento].filter(Boolean).join(' · '),
    cenario: cenarioObj?.label ?? selectedCenario,
    instrucoes,

    gabarito: gabarito ? {
      posicao_x: gabarito.posicao_x,
      posicao_y: gabarito.posicao_y,
      escala: gabarito.escala,
      rotacao: gabarito.rotacao,
      nome: gabarito.nome,
    } : null,

    modelo: modelo ? {
      nome: modelo.nome,
      genero: modelo.genero,
      descricao: modelo.descricao,
      tom_pele: modelo.tom_pele,
      retratoUrl: modelo.retrato_url,
    } : null,
  }),
}
);

      const result = await response.json();



      if (!response.ok || result.error) {

        throw new Error(result.error || `Erro na geração (${response.status})`);

      }



      // Update generation with result

      const { data: updated } = await supabase

        .from('geracoes')

        .update({

          status: 'concluida',

          imagem_path: result.imagemPath ?? null,

          imagem_url: result.imagemUrl ?? null,

          prompt_usado: result.prompt ?? null,

          modelo_ia: result.modelo ?? null,

        })

        .eq('id', genRecord.id)

        .select()

        .maybeSingle();



      if (updated) {

        setGeracoes((prev) => [updated, ...prev]);

      }

    } catch (err) {

      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido na geração.';

      await supabase

        .from('geracoes')

        .update({ status: 'erro', erro_mensagem: errMsg })

        .eq('id', genRecord.id);



      const { data: failedGen } = await supabase

        .from('geracoes')

        .select('*')

        .eq('id', genRecord.id)

        .maybeSingle();



      if (failedGen) {

        setGeracoes((prev) => [failedGen, ...prev]);

      }

      setGenerateError(errMsg);

    } finally {

      setGenerating(false);

    }

  };



  const handleNext = async () => {

    // Auto-save peca when leaving step 2

    if (currentStep === 2 && pecaData.nome) {

      await savePeca();

    }

    if (currentStep === 4) setCurrentStep(6);
  else if (currentStep < 6) setCurrentStep(currentStep + 1);

  };



  const handlePrev = () => {

    if (currentStep === 6) setCurrentStep(4);
  else if (currentStep > 1) setCurrentStep(currentStep - 1);

  };



  const handleReset = () => {

    onClearEditing();

    setSavedPeca(null);

    setPecaData({

      nome: '', tipo: '', dimensoes: '', material: '',

      cordao_tipo: '', cordao_comprimento: '', observacoes: '',

      foto_original_path: null, foto_original_url: null,

    });

    setGeracoes([]);

    setGenerateError(null);

    setSelectedCenario('estudio');

    setInstrucoes('');

    setSelectedModeloId(null);

    setCurrentStep(1);

  };



  const hasFoto = !!pecaData.foto_original_url;

  const hasNome = !!pecaData.nome.trim();

  const canGenerateModelo = !!selectedModeloId;



  return (

    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Step indicators */}

      <div className="mb-10">

        <div className="flex items-center justify-between mb-2">

          <h2 className="text-2xl font-display font-light text-clay-900">

            {savedPeca ? `Editando: ${savedPeca.nome}` : 'Novo Estúdio'}

          </h2>

          {savedPeca && (

            <button onClick={handleReset} className="btn-ghost text-xs">

              Nova peça

            </button>

          )}

        </div>



        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">

          {STEPS.map((step, idx) => (

            <div key={step.num} className="flex items-center shrink-0">

              <div className="flex items-center gap-2">

                <div

                  className={`step-indicator ${

                    currentStep === step.num

                      ? 'step-active'

                      : currentStep > step.num

                      ? 'step-completed'

                      : 'step-pending'

                  }`}

                >

                  {currentStep > step.num ? <Check className="w-4 h-4" /> : idx + 1}

                </div>

                <span

                  className={`text-xs hidden sm:inline ${

                    currentStep === step.num ? 'text-clay-900 font-medium' : 'text-clay-400'

                  }`}

                >

                  {step.label}

                </span>

              </div>

              {idx < STEPS.length - 1 && (

                <div className={`w-4 sm:w-8 h-px mx-1 ${currentStep > step.num ? 'bg-clay-400' : 'bg-clay-200'}`} />

              )}

            </div>

          ))}

        </div>

      </div>



      {/* Step content */}

      <div className="card p-6 sm:p-8 mb-6">

        {currentStep === 1 && (

          <StepFoto

            fotoUrl={pecaData.foto_original_url}

            fotoPath={pecaData.foto_original_path}

            onUpload={handleFotoUpload}

            onClear={handleFotoClear}

          />

        )}

        {currentStep === 2 && (

          <StepCadastro

            data={pecaData}

            onChange={(partial) => setPecaData((prev) => ({ ...prev, ...partial }))}

          />

        )}

        {currentStep === 3 && (

          <StepGabarito

            gabaritos={gabaritos}

            selectedId={selectedGabaritoId}

            onSelect={setSelectedGabaritoId}

            onSave={handleSaveGabarito}

            onDelete={handleDeleteGabarito}

            fotoUrl={pecaData.foto_original_url}

            tipoJoia={pecaData.tipo}

          />

        )}

        {currentStep === 4 && (

          <StepModelo

            modelos={modelos}

            selectedId={selectedModeloId}

            onSelect={setSelectedModeloId}

          />

        )}

        {currentStep === 6 && (

          <StepGeracao

            peca={savedPeca}

            geracoes={geracoes}

            onGenerate={handleGenerate}

            generating={generating}

            generateError={generateError}

            hasFoto={hasFoto}

            hasNome={hasNome}

            canGenerateModelo={canGenerateModelo}

          />

        )}

      </div>



      {/* Navigation buttons */}

      {currentStep < 6 && (

        <div className="flex justify-between">

          <button

            onClick={handlePrev}

            disabled={currentStep === 1}

            className="btn-secondary"

          >

            <ChevronLeft className="w-4 h-4" /> Voltar

          </button>

          <button onClick={handleNext} className="btn-primary">

            Avançar <ChevronRight className="w-4 h-4" />

          </button>

        </div>

      )}

      {currentStep === 6 && (

        <div className="flex justify-between">

          <button onClick={handlePrev} className="btn-secondary">

            <ChevronLeft className="w-4 h-4" /> Voltar

          </button>

        </div>

      )}

    </div>

  );

}
