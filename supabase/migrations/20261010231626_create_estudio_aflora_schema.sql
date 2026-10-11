/*
# Estúdio Aflora — Schema inicial

## Visão geral
Cria as tabelas principais do Estúdio Aflora: peças, gerações, gabaritos,
modelos virtuais, cenários e configurações do usuário.
Todos os dados são privados por conta (multi-user com autenticação).

## Tabelas criadas

1. **pecas** — cadastro de biojoias
   - id (uuid, PK)
   - user_id (uuid, FK auth.users, dono da peça)
   - nome (text, nome da peça)
   - tipo (text, tipo de biojoia: pingente, colar, brinco, pulseira, anel, etc.)
   - dimensoes (text, medidas da peça)
   - material (text, materiais utilizados)
   - cordao_tipo (text, tipo do cordão)
   - cordao_comprimento (text, comprimento do cordão)
   - observacoes (text, observações opcionais)
   - foto_original_path (text, caminho no storage da foto original)
   - foto_original_url (text, URL pública/assinada da foto original)
   - criada_em (timestamptz)
   - atualizada_em (timestamptz)

2. **geracoes** — fotografias geradas por IA
   - id (uuid, PK)
   - peca_id (uuid, FK pecas)
   - user_id (uuid, FK auth.users)
   - tipo_geracao (text: 'editorial' ou 'modelo')
   - modelo_id (uuid, FK modelos, nullable)
   - cenario (text, cenário escolhido)
   - instrucoes (text, instruções adicionais)
   - gabarito_id (uuid, FK gabaritos, nullable)
   - imagem_path (text, caminho no storage)
   - imagem_url (text, URL da imagem gerada)
   - status (text: 'pendente', 'processando', 'concluida', 'erro')
   - erro_mensagem (text, nullable)
   - prompt_usado (text, prompt enviado à IA)
   - modelo_ia (text, modelo de imagem usado)
   - criada_em (timestamptz)

3. **gabaritos** — gabaritos fotográficos de posicionamento
   - id (uuid, PK)
   - user_id (uuid, FK auth.users)
   - nome (text, nome do gabarito)
   - tipo (text: 'pingente', 'circular', 'brinco', 'personalizado')
   - posicao_x (numeric, posição horizontal %)
   - posicao_y (numeric, posição vertical %)
   - escala (numeric, escala da joia %)
   - rotacao (numeric, rotação em graus)
   - e_padrao (boolean, se é um dos 8 gabaritos padrão)
   - criada_em (timestamptz)

4. **modelos** — modelos virtuais
   - id (uuid, PK)
   - user_id (uuid, FK auth.users, nullable — modelos padrão têm user_id null)
   - nome (text, nome do modelo)
   - genero (text: 'feminino' ou 'masculino')
   - descricao (text, descrição física)
   - tom_pele (text, tom de pele)
   - retrato_path (text, caminho do retrato no storage)
   - retrato_url (text, URL do retrato)
   - e_padrao (boolean, se é modelo padrão do sistema)
   - criada_em (timestamptz)

5. **configuracoes** — configurações do usuário
   - id (uuid, PK)
   - user_id (uuid, FK auth.users, unique)
   - modelo_ia (text, modelo de imagem preferido)
   - preferencias (jsonb, preferências gerais)

## Segurança
- RLS habilitado em todas as tabelas.
- Políticas owner-scoped (auth.uid() = user_id) para peças, gerações, gabaritos, configurações.
- Modelos: usuários podem ver modelos padrão (user_id IS NULL) e seus próprios.
- Todas as colunas user_id têm DEFAULT auth.uid() para inserts funcionarem sem passar o user_id explicitamente.
*/

-- ============================================================
-- TABELA: pecas
-- ============================================================
CREATE TABLE IF NOT EXISTS pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text,
  dimensoes text,
  material text,
  cordao_tipo text,
  cordao_comprimento text,
  observacoes text,
  foto_original_path text,
  foto_original_url text,
  criada_em timestamptz DEFAULT now(),
  atualizada_em timestamptz DEFAULT now()
);

ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pecas" ON pecas;
CREATE POLICY "select_own_pecas" ON pecas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pecas" ON pecas;
CREATE POLICY "insert_own_pecas" ON pecas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pecas" ON pecas;
CREATE POLICY "update_own_pecas" ON pecas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pecas" ON pecas;
CREATE POLICY "delete_own_pecas" ON pecas FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TABELA: gabaritos
-- ============================================================
CREATE TABLE IF NOT EXISTS gabaritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'personalizado',
  posicao_x numeric DEFAULT 50,
  posicao_y numeric DEFAULT 50,
  escala numeric DEFAULT 30,
  rotacao numeric DEFAULT 0,
  e_padrao boolean DEFAULT false,
  criada_em timestamptz DEFAULT now()
);

ALTER TABLE gabaritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_gabaritos" ON gabaritos;
CREATE POLICY "select_own_gabaritos" ON gabaritos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gabaritos" ON gabaritos;
CREATE POLICY "insert_own_gabaritos" ON gabaritos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gabaritos" ON gabaritos;
CREATE POLICY "update_own_gabaritos" ON gabaritos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_gabaritos" ON gabaritos;
CREATE POLICY "delete_own_gabaritos" ON gabaritos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TABELA: modelos
-- ============================================================
CREATE TABLE IF NOT EXISTS modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  genero text NOT NULL DEFAULT 'feminino',
  descricao text,
  tom_pele text,
  retrato_path text,
  retrato_url text,
  e_padrao boolean DEFAULT false,
  criada_em timestamptz DEFAULT now()
);

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver modelos padrão (user_id IS NULL) e seus próprios
DROP POLICY IF EXISTS "select_modelos" ON modelos;
CREATE POLICY "select_modelos" ON modelos FOR SELECT
  TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_modelos" ON modelos;
CREATE POLICY "insert_own_modelos" ON modelos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_modelos" ON modelos;
CREATE POLICY "update_own_modelos" ON modelos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_modelos" ON modelos;
CREATE POLICY "delete_own_modelos" ON modelos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TABELA: geracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS geracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id uuid NOT NULL REFERENCES pecas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_geracao text NOT NULL DEFAULT 'editorial',
  modelo_id uuid REFERENCES modelos(id) ON DELETE SET NULL,
  cenario text,
  instrucoes text,
  gabarito_id uuid REFERENCES gabaritos(id) ON DELETE SET NULL,
  imagem_path text,
  imagem_url text,
  status text NOT NULL DEFAULT 'pendente',
  erro_mensagem text,
  prompt_usado text,
  modelo_ia text,
  criada_em timestamptz DEFAULT now()
);

ALTER TABLE geracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_geracoes" ON geracoes;
CREATE POLICY "select_own_geracoes" ON geracoes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_geracoes" ON geracoes;
CREATE POLICY "insert_own_geracoes" ON geracoes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_geracoes" ON geracoes;
CREATE POLICY "update_own_geracoes" ON geracoes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_geracoes" ON geracoes;
CREATE POLICY "delete_own_geracoes" ON geracoes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  modelo_ia text DEFAULT 'gpt-image-1',
  preferencias jsonb DEFAULT '{}'::jsonb,
  criada_em timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_configuracoes" ON configuracoes;
CREATE POLICY "select_own_configuracoes" ON configuracoes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_configuracoes" ON configuracoes;
CREATE POLICY "insert_own_configuracoes" ON configuracoes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_configuracoes" ON configuracoes;
CREATE POLICY "update_own_configuracoes" ON configuracoes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_configuracoes" ON configuracoes;
CREATE POLICY "delete_own_configuracoes" ON configuracoes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pecas_user_id ON pecas(user_id);
CREATE INDEX IF NOT EXISTS idx_pecas_criada_em ON pecas(criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_geracoes_peca_id ON geracoes(peca_id);
CREATE INDEX IF NOT EXISTS idx_geracoes_user_id ON geracoes(user_id);
CREATE INDEX IF NOT EXISTS idx_gabaritos_user_id ON gabaritos(user_id);
CREATE INDEX IF NOT EXISTS idx_modelos_user_id ON modelos(user_id);

-- ============================================================
-- TRIGGER: atualizar atualizada_em em pecas
-- ============================================================
CREATE OR REPLACE FUNCTION update_atualizada_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizada_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pecas_atualizada_em ON pecas;
CREATE TRIGGER trigger_pecas_atualizada_em
  BEFORE UPDATE ON pecas
  FOR EACH ROW EXECUTE FUNCTION update_atualizada_em();
