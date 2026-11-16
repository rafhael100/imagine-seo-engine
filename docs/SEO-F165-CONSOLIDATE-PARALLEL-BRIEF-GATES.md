# SEO F165 — integração de PRs paralelas ao candidato RC61

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY**. Continuação da [RC61 #246](https://github.com/rafhael100/imagine-seo-engine/pull/246).

## Motivo

A cadeia RC61 F159–F164 não continha três correções implementadas paralelamente:
- [SEO #233](https://github.com/rafhael100/imagine-seo-engine/pull/233): recusa auditoria de build com zero páginas e exige integridade das contagens e rotas.
- [SEO #238](https://github.com/rafhael100/imagine-seo-engine/pull/238): priorização de achados técnicos reais (sitemap, hreflang, canonical, indexação, links e conteúdo).
- [SEO #239](https://github.com/rafhael100/imagine-seo-engine/pull/239): rejeição de rotas forjadas, escapes, traversal, query, fragment e autoridade externa.

## Integração verificável

O último commit da linha paralela #239, `050b4e7ed0133227277dbdd24d69ffd5ee488dec`, contém cumulativamente #233 e #238. Foram comparados os seis arquivos afetados com os equivalentes RC61. As mudanças em `src/seo-brief.mjs` são aditivas; em `src/portal-handoff.mjs` há apenas o bloqueio `pages===0`; as demais diferenças são testes e fixtures correspondentes. Não foram substituídos outros componentes nem alterações da cadeia F159–F164.

Arquivos integrados: `src/seo-brief.mjs`, `src/portal-handoff.mjs`, `tests/seo-brief.test.mjs`, `tests/portal-handoff.test.mjs`, `tests/gsc-daily-brief.test.mjs`, `tests/portal-original-gsc-handoff.test.mjs`.

## Aceite e limites

Exigir testes Node 22/24 sobre a própria HEAD e revisar o diff. Um relatório de zero páginas, rotas falsas ou dados privados nunca pode ser promovido a evidência positiva. GSC, editorial, IBGE, Portal/CRM e staging real continuam sujeitos a autorização e validação independente.

Nenhuma PR foi mesclada e nenhum deploy ou publicação foi realizado por esta integração.
