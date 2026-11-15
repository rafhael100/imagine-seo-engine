# SEO RC44 — exceções territoriais e controles RC43 integrados

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [RC43 #170](https://github.com/rafhael100/imagine-seo-engine/pull/170).

## Integração
- Preserva RC43: captura HTTPS com recibo IBGE e validação do idioma da página compilada; auditoria estática e prévias privadas.
- Adiciona [F118 #169](https://github.com/rafhael100/imagine-seo-engine/pull/169): Brasília/DF (código `5300108`) e Fernando de Noronha/PE (código `2605459`) são unidades territoriais especiais, exigindo análise editorial separada da regra geral para município.
- O resultado de rascunho especial é `blocked` com motivo `known_special_territorial_unit_requires_separate_editorial_review`, sem exibir dados privados.
- A presença dessas unidades no inventário já existente apenas incrementa contagem e não bloqueia, por si só, outras páginas municipais válidas.
- A validação não afirma taxonomia territorial completa nem atualizada.

## Evidências
Executar `npm test` e os workflows de paridade Astro/Comercial e vazamento de prévias. Verificar na SHA desta integração, não inferir do teste isolado da F118.

## Gate do IBGE
O teste online de captura HTTPS da API IBGE foi bloqueado anteriormente por `curl exit 28 / HTTP 000` no runner. A RC43 separou política offline obrigatória (PR) e teste real explícito `workflow_dispatch`. Não apresentar como origem confirmada um teste `skipped`. A íntegra do documento municipal precisa ser obtida e autenticada em ambiente operacional autorizado.

## Sem liberação
Nenhuma alteração de `main`, VPS, DNS, página pública, indexação, acesso a clientes, Google OAuth ou cobrança. Revisões editoriais, LGPD, AppSec, staging, backup e rollback continuam obrigatórias.
