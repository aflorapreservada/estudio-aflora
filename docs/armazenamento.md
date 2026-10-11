# Armazenamento de fotografias

## Diagnóstico comprovado no código

- A função antiga gravava gerações em `pecas-fotos`, enquanto StudioPage as assinava em `geracoes-imagens`. Objetos antigos permanecem no bucket original; o resolvedor tenta ambos, sob a mesma RLS do usuário.
- Biblioteca usava URLs persistidas sem renovar. A função consumia URLs recebidas do navegador, inclusive retratos expirados; ignorava erros ao buscar retratos.
- StepModelo ocultava falhas de download/exibição, sem diagnóstico. Sua implementação de object URLs também podia criar URLs após o cleanup do efeito.
- As migrations versionadas só possuem políticas de Storage para `pecas-fotos`. A leitura da tabela `modelos` não autoriza a leitura de `storage.objects`.
- HTTP 400 não prova, isoladamente, que falta política: objeto ausente, caminho/capitalização errados e objeto invisível por RLS precisam ser conferidos no projeto remoto.

## Correção

Os campos `*_path` são a fonte permanente. Não persistimos novas URLs assinadas no banco. URLs históricas do mesmo projeto permitem recuperar caminhos e o bucket antigo mesmo com token expirado. Caminhos preservam letras maiúsculas e subpastas; prefixos de bucket são removidos. URLs externas não são interpretadas como Storage.

StorageImage/useStorageImage atendem retratos, originais e Biblioteca. GeracaoCard usa o mesmo hook para preview, canvas e download. URLs têm uma hora de validade, cache por usuário, renovação aos 50 minutos, verificação no retorno à aba e uma tentativa de renovação após falha de imagem. Erros permanentes aparecem na interface. URLs blob do canvas são liberadas.

A função fonte é `supabase/functions/generate-image/index.ts` (não existe `dist/generate-image-aflora.ts` nesta cópia). Ela consulta peça, geração e modelo com o JWT do usuário; baixa referências por caminhos do banco, respeitando RLS; grava novas imagens em `geracoes-imagens/user_id/peca_id/...`; persiste o caminho antes de responder. A service role permanece apenas no servidor para upload. Falhas de retrato interrompem a geração em vez de descartar silenciosamente a referência.

## Verificação e aplicação remota pendentes

Nenhuma política foi aplicada remotamente, nenhum objeto foi removido/movido e nenhum upload foi realizado durante a correção. Não foi possível confirmar os 14 caminhos ou políticas ativas com uma sessão autenticada remota. Não há Deno instalado para validar/executar a função localmente.

1. Execute `docs/storage-diagnostico.sql` no SQL Editor. Confirme os três buckets privados, os 14 caminhos exatamente iguais a `storage.objects.name` e as políticas existentes. SELECT da tabela e SELECT do Storage são controles separados. Teste leitura com sessão de usuário; SQL Editor administrativo sozinho não valida RLS.
2. Se faltarem as permissões, aplique `20261011000000_private_image_read_access.sql`. Ela acrescenta apenas SELECT: retratos vinculados a modelos visíveis (padrão ou do próprio usuário) e gerações na pasta do usuário. Não concede escrita, não torna buckets públicos e não substitui políticas existentes. Políticas permissivas são somadas; confira políticas amplas já existentes. Os buckets precisam existir; a migration não os recria. Para retrato_path armazenado como URL completa, normalize para nome relativo após conferir o objeto, pois a política proposta compara nomes relativos ou prefixados por bucket.
3. Publique a função com `supabase functions deploy generate-image` e o frontend atualizado em conjunto. O novo frontend depende da função que salva a geração no servidor.
4. Valide com dois usuários: 14 modelos padrão visíveis; modelos particulares somente para seu dono; peças/gerações do outro usuário negadas; reabertura sem upload; renovação após uma hora e retorno à aba; geração editorial/com modelo; preview e download com etiqueta.

Fotografias particulares futuras devem usar `user_id` na linha de modelos e caminho próprio. A leitura exige vínculo com uma linha visível. Um fluxo futuro de upload precisará de INSERT restrito à pasta do usuário; a migration atual deliberadamente acrescenta apenas a leitura necessária.

## Verificações locais

`node --test tests/storage.test.mjs`: casos de caminhos, URLs antigas, bucket legado, renovação/cache, isolamento de contas, sessão ausente e erros de Storage, com cliente simulado. Não substituem teste remoto de RLS.

`npm run typecheck`, `npm run build`, `npm run lint` (sem erros; avisos existentes de hooks/fast refresh).
