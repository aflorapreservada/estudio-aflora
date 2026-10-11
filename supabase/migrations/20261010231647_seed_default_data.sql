/*
# Estúdio Aflora — Dados iniciais: gabaritos e modelos padrão

## Visão geral
Insere os 8 gabaritos fotográficos padrão e 5 modelos virtuais padrão.
Estes registros têm user_id = NULL (modelos) para serem visíveis a todos os usuários,
ou e_padrao = true (gabaritos) para identificação.

## Gabaritos padrão (8)
1. Pingente Centralizado (pingente)
2. Pingente Deslocado (pingente)
3. Circular Centralizado (circular)
4. Circular com Detalhe (circular)
5. Circular em Movimento (circular)
6. Brinco isolado (brinco)
7. Par de Brincos (brinco)
8. Brinco em Uso (brinco)

## Modelos padrão (5)
1. Helena — feminino, pele clara
2. Yara — feminino, pele morena
3. Zara — feminino, pele negra
4. Theo — masculino, pele clara
5. Kaique — masculino, pele morena
*/

-- ============================================================
-- GABARITOS PADRÃO
-- Nota: gabaritos padrão são criados por cada usuário a partir da interface.
-- Aqui inserimos apenas os modelos padrão.
-- ============================================================

-- ============================================================
-- MODELOS PADRÃO (user_id = NULL, e_padrao = true)
-- ============================================================
INSERT INTO modelos (nome, genero, descricao, tom_pele, e_padrao, user_id)
VALUES
  ('Helena', 'feminino', 'Cabelos castanhos longos, olhos verdes, rosto oval, feições delicadas', 'Clara', true, NULL),
  ('Yara', 'feminino', 'Cabelos negros lisos, olhos castanhos, rosto arredondado, traços indígenas', 'Morena', true, NULL),
  ('Zara', 'feminino', 'Cabelos crespos, olhos escuros, rosto marcante, beleza afro-brasileira', 'Negra', true, NULL),
  ('Theo', 'masculino', 'Cabelos castanhos, barba leve, olhos azuis, rosto quadrado', 'Clara', true, NULL),
  ('Kaique', 'masculino', 'Cabelos negros, barba cerrada, olhos castanhos, traços fortes', 'Morena', true, NULL)
ON CONFLICT DO NOTHING;
