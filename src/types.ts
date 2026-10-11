export interface Peca {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  dimensoes: string;
  material: string;
  cordao_tipo: string;
  cordao_comprimento: string;
  observacoes: string;
  foto_original_path: string | null;
  foto_original_url: string | null;
  criada_em: string;
  atualizada_em: string;
}

export interface PecaInput {
  nome: string;
  tipo: string;
  dimensoes: string;
  material: string;
  cordao_tipo: string;
  cordao_comprimento: string;
  observacoes: string;
  foto_original_path: string | null;
  foto_original_url: string | null;
}

export interface Gabarito {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  posicao_x: number;
  posicao_y: number;
  escala: number;
  rotacao: number;
  e_padrao: boolean;
  criada_em: string;
}

export interface GabaritoInput {
  nome: string;
  tipo: string;
  posicao_x: number;
  posicao_y: number;
  escala: number;
  rotacao: number;
  e_padrao: boolean;
}

export interface Modelo {
  id: string;
  user_id: string | null;
  nome: string;
  genero: string;
  descricao: string;
  tom_pele: string;
  retrato_path: string | null;
  retrato_url: string | null;
  e_padrao: boolean;
  criada_em: string;
}

export type TipoGeracao = 'editorial' | 'modelo';
export type StatusGeracao = 'pendente' | 'processando' | 'concluida' | 'erro';

export interface Geracao {
  id: string;
  peca_id: string;
  user_id: string;
  tipo_geracao: TipoGeracao;
  modelo_id: string | null;
  cenario: string;
  instrucoes: string;
  gabarito_id: string | null;
  imagem_path: string | null;
  imagem_url: string | null;
  status: StatusGeracao;
  erro_mensagem: string | null;
  prompt_usado: string | null;
  modelo_ia: string | null;
  criada_em: string;
}

export interface Configuracoes {
  id: string;
  user_id: string;
  modelo_ia: string;
  preferencias: Record<string, unknown>;
  criada_em: string;
}

export interface CenarioOption {
  value: string;
  label: string;
  descricao: string;
}

export const CENARIOS: CenarioOption[] = [
  { value: 'estudio', label: 'Estúdio', descricao: 'Fundo neutro, iluminação controlada' },
  { value: 'praia', label: 'Praia', descricao: 'Areia, mar, luz natural' },
  { value: 'natureza', label: 'Natureza', descricao: 'Floresta, plantas, ambiente natural' },
  { value: 'festa', label: 'Festa', descricao: 'Ambiente festivo, luzes, celebração' },
  { value: 'social', label: 'Social', descricao: 'Encontro casual, ambiente cotidiano' },
  { value: 'esporte', label: 'Esporte', descricao: 'Movimento, energia, ar livre' },
  { value: 'elegante', label: 'Elegante', descricao: 'Ambiente sofisticado, luxo' },
  { value: 'dia', label: 'Dia', descricao: 'Luz diurna, ambiente claro' },
  { value: 'noite', label: 'Noite', descricao: 'Luz noturna, atmosfera intimista' },
];

export const TIPOS_BIOJOIA = [
  'Pingente',
  'Colar',
  'Brinco',
  'Pulseira',
  'Anel',
  'Tornozeleira',
  'Outro',
];

export const GABARITOS_PADRAO = [
  { nome: 'Pingente Centralizado', tipo: 'pingente', posicao_x: 50, posicao_y: 45, escala: 25, rotacao: 0 },
  { nome: 'Pingente Deslocado', tipo: 'pingente', posicao_x: 65, posicao_y: 40, escala: 20, rotacao: 0 },
  { nome: 'Circular Centralizado', tipo: 'circular', posicao_x: 50, posicao_y: 50, escala: 35, rotacao: 0 },
  { nome: 'Circular com Detalhe', tipo: 'circular', posicao_x: 50, posicao_y: 50, escala: 30, rotacao: 15 },
  { nome: 'Circular em Movimento', tipo: 'circular', posicao_x: 45, posicao_y: 48, escala: 32, rotacao: -10 },
  { nome: 'Brinco Isolado', tipo: 'brinco', posicao_x: 50, posicao_y: 50, escala: 28, rotacao: 0 },
  { nome: 'Par de Brincos', tipo: 'brinco', posicao_x: 50, posicao_y: 50, escala: 22, rotacao: 0 },
  { nome: 'Brinco em Uso', tipo: 'brinco', posicao_x: 55, posicao_y: 35, escala: 15, rotacao: 0 },
];
