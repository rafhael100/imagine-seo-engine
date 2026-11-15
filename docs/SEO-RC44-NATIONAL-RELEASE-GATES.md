# Imagine SEO RC44 — release candidate de integração técnica nacional

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

## Escopo acumulado

A RC44 consolida:
1. [RC42 #165](https://github.com/rafhael100/imagine-seo-engine/pull/165): segurança de prévias, auditoria local e mutações no build Astro.
2. [F117 idioma #167](https://github.com/rafhael100/imagine-seo-engine/pull/167): coerência entre rota municipal e idioma real do HTML.
3. [F117 captura IBGE #166](https://github.com/rafhael100/imagine-seo-engine/pull/166): HTTPS com hostname fixo, SHA-256 e recibos privados, com checagens determinísticas e fonte ao vivo separadas.
4. [F118 especial #169](https://github.com/rafhael100/imagine-seo-engine/pull/169): Brasília/DF e Fernando de Noronha/PE exigem decisão editorial especial.
5. [RC43 #170](https://github.com/rafhael100/imagine-seo-engine/pull/170) e [integração #171](https://github.com/rafhael100/imagine-seo-engine/pull/171): validação conjunta das implementações, sem refazer manualmente a sequência de PRs.

## Critérios automatizados
- Node.js 22 e 24 (testes completos, incluindo F118).
- Paridade Astro fixo Comercial: títulos, indexação, canonical, hreflang, rotas, alternância de idioma, conteúdo privado.
- Negative testing de HTML de prévia inserido em build Astro, com restauração e reauditoria.
- Política offline da captura IBGE e consistência de recibo.

## Falha de transporte externo ainda pendente
Em 15/11/2026, o runner do GitHub não alcançou a API Localidades IBGE: curl exit 28 / HTTP 000, capturador Node reportou `official_source_transport_unavailable`. A rota HTTPS é fixa para evitar URLs arbitrárias/redirecionamentos. O teste real agora fica **separado e sujeito a workflow_dispatch**: seu estado `skipped` na PR não é aprovação da captura oficial.

## Gates para publicação
- Concluir captura HTTPS real e conferir proveniência e edição territorial.
- Revisão editorial de municípios e unidades especiais, conteúdo único e prestação local efetiva.
- Resolver autorização autenticada do Portal/Sites, revisão editorial por tenant e infraestrutura de publicação com rollback.
- Google Search Console OAuth readonly validado, grants revogáveis, proteção de tokens, analytics/CRM com atribuição verdadeira.
- Auditoria independente LGPD/AppSec/DBA e teste de VPS staging, backup/restauração e CDN.
- Revisão integral do diff com main e aceite formal de release.

## Limitações
Testes de build estático são reais, mas usam um checkout fixo do Comercial, não a VPS produtiva. Validação de código geográfico e SHA-256 não prova que cada localidade é município autônomo nem que a edição foi assinada pelo IBGE. A operação não altera DNS, site publicado ou dados de cliente.

**ReleaseStatus: HOLD_LIVE_IBGE_PORTAL_OAUTH_STAGING_EDITORIAL_APPROVAL.**
