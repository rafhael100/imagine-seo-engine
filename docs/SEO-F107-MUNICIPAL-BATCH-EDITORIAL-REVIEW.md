# SEO-F107 — triagem editorial em lote de páginas municipais (offline)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continua a [F106](https://github.com/rafhael100/imagine-seo-engine/pull/153)
no repositório independente Imagine SEO Engine.

## Problema

A estratégia de páginas por serviço e município não pode produzir milhares
de páginas apenas trocando a cidade e a UF. Isso criaria risco de conteúdo
redundante e páginas com pouco valor local para quem faz a pesquisa.
O filtro F2 já avalia um rascunho por vez; a F107 acrescenta uma
**triagem em lote**, detectando também duplicações entre os próprios
novos rascunhos.

## Entradas locais

O operador prepara um arquivo JSON privado com três campos:

- candidates: entre 1 e 25 rascunhos, cada um com serviceSlug,
  ibgeCode, city, state, availabilityConfirmed, reasonForLocalPage,
  localContent e demandEvidence (0–20 evidências com source,
  observedAt e explanation)
- existing: até 250 páginas anteriores reduzidas a serviceSlug,
  ibgeCode, city, state e localContent
- maxSimilarity: limiar entre 0,10 e 0,95; recomendado 0,75

O input completo é limitado a 512 KiB no CLI. Não aceita campos
ocultos, getters, símbolos, credenciais, scripts ou grandes lotes.
O filtro compara rascunhos com o inventário fornecido **e uns com
os outros**, incluindo rascunhos bloqueados.

Exemplo de execução somente local:

    node scripts/review-geo-batch-offline.mjs private-drafts.json

A saída contém apenas índices dos rascunhos, razão da reprovação,
similaridade máxima, contagens e status **revisão humana** ou
**bloqueado**. Não contém nomes de cidades, HTML, texto da página,
termos de pesquisa, URLs, e-mail, telefone ou conteúdo das evidências.

## Segurança e limites

Não existe geração automática de páginas, sitemap, URL, deploy,
publicação ou indexação. Todo item mantém publishAllowed=false e
indexingAllowed=false mesmo se passar no filtro técnico.

Este teste **não consulta a base oficial do IBGE**, não verifica
se a Imagine atende a determinada cidade nem mede demanda real.
O inventário de 250 páginas pode estar incompleto; portanto,
uma triagem limpa **não comprova ausência de duplicações nacionais**.
A operação produtiva exigirá índice global de páginas publicadas,
base IBGE atualizada, comprovação editorial e atendimento local,
análise técnica/SEO e um fluxo de aprovação formal.

A funcionalidade é offline, sem conexões com Google, OpenSEO,
Analytics, CRM, VPS ou dados de clientes.

## Testes

    npm test

Testes unitários e CLI cobrem:
- rascunho completo segue apenas para humano, sem indexar
- troca de cidade mantendo o texto é bloqueada
- município/serviço duplicado é bloqueado
- demanda ausente e dados pessoais geram bloqueio
- IBGE com formato válido não ganha selo de validação
- limites, payloads adulterados e getters são recusados
- saída e mensagens do CLI não expõem conteúdo privado

**Main, hospedagem, DNS, conteúdo público e billing permanecem intactos.**
