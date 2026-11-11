# Imagine SEO Engine

Motor de auditoria técnica e análise SEO **offline**, sem conexão com contas de clientes nem publicação automática.

## Estado técnico em 09/11/2026
- Etapas SEO-F0…F14 implementadas em PRs de desenvolvimento, com 78 testes Node aprovados na ponta F14: https://github.com/rafhael100/imagine-seo-engine/pull/17
- Esta branch adiciona testes de ponta a ponta para os CLIs (SEO-F15).
- `main` permanece sem merge. O código **não é uma operação SaaS habilitada**; todas as fontes GSC são exportações manuais ou respostas fornecidas offline.
- Imagine Comercial permanece prioridade P0, SEO Engine P1.

## Funções locais
- Auditor: `node scripts/audit-dist.mjs dist https://example.com/ --fail-on-warnings`
- Comparação de builds: `node scripts/compare-audit-offline.mjs antes.json depois.json`
- Análise de consultas CSV: `node scripts/report-gsc-csv-offline.mjs consultas.csv 2026-10-01 2026-10-07`
- Tendência entre períodos: `node scripts/compare-gsc-csv-offline.mjs antes.csv 2026-10-01 2026-10-07 depois.csv 2026-10-08 2026-10-14`

## Testes
- `npm test` roda testes unitários e os cenários de ponta a ponta com dados fictícios.
- `npm run test:smoke` roda apenas os CLIs sintéticos.
- Node.js 22 ou superior, sem dependências externas ou instalação de fornecedores.

## Limites antes de produção
1. Confirmar acesso autorizado à propriedade Search Console real, consentimento e credenciais OAuth somente leitura.
2. Implementar autenticação/segregação multiempresa no Portal, RBAC, criptografia de tokens, retenção e LGPD.
3. Fazer homologação na VPS quando disponível; conferir configuração, monitoramento, backups, migrações e rollback.
4. Validar integração de CI e atualização segura do SHA pinado no Imagine Comercial.
5. Revisar e aprovar integração/merge em `main`; **não publicar páginas, trocar DNS ou ativar cobrança automaticamente**.

Checklist rastreável: https://github.com/rafhael100/imagine-seo-engine/issues/14

Dados artificiais de testes não demonstram tráfego, ranking, indexação ou conformidade de produção.

## Relatório executivo local SEO-F17

`node scripts/report-seo-brief-offline.mjs auditoria.json [comparacao-gsc.json]` produz categorias fixas de revisão e totais agregados para futura interface do Portal. O comando não publica relatórios nem consulta o Google, e não imprime termos, caminhos de arquivos ou mensagens livres do input.

## Revisão de migração de URLs (SEO-F22)

`node scripts/review-route-migration-offline.mjs before.json after.json candidates.json` verifica candidatos 301 informados manualmente, mas **nunca** gera regras ou autoriza publicação. Qualquer URL removida mantém o gate de revisão humana e status de saída 1. Variantes com query, percent-encoding ou destino externo são rejeitadas.

## Envelope de revisão para Portal (SEO-F24)

`node scripts/prepare-portal-handoff-offline.mjs brief.json tenantRef propertySha256 sourceCommitSha` gera contrato de revisão sanitizado. O campo `customerDisplayAuthorized` é sempre `false`; cabe ao Portal real autenticar, autorizar e comprovar propriedade/consentimento. Não há rota API, dashboard SaaS, credencial ou publicação implementada por este comando.

## Política reforçada para páginas públicas (SEO-F25)

Adicione `--strict-public-head` ao auditor para exigir `meta robots=index,follow` e `og:url` correspondente à URL canônica, além das verificações padrão. Recomendado somente para builds de páginas públicas curadas; continua desativado por padrão para manter compatibilidade com outros builds estáticos.

## Verificação de head HTML (SEO-F26)

Metadados técnicos indexáveis são validados somente quando localizados no `<head>` verdadeiro do arquivo HTML; comentários e tags inseridas no `<body>` não podem satisfazer os requisitos da auditoria. Os testes continuam locais e sintéticos.

## Orçamento de recursos do auditor (SEO-F27)

O crawler local tem orçamentos rígidos de diretórios, entradas e profundidade, além do limite de HTML. Testes podem reduzir estes limites usando `crawlLimits` (não é possível aumentá-los); os limites padrão atendem builds estáticos curados. Arquivos são inspecionados somente em workspace controlado.

## Regras robots.txt por grupo (SEO-F28)

A auditoria distingue regras `User-agent: Googlebot` e `User-agent: *`, sem confundir o bloqueio de um robô específico com o de indexação geral. Somente uma diretiva `Sitemap:` real, e não menção em comentário, atende ao requisito. Os demais algoritmos de precedência para caminhos complexos continuam fora do escopo offline.

## Argumentos seguros de CLI (SEO-F29)

O comando `audit-dist.mjs` aceita no máximo um diretório e uma URL de origem, além de `--fail-on-warnings` e `--strict-public-head`. Opções desconhecidas ou repetidas provocam erro, em vez de desabilitar silenciosamente uma proteção.

## Qualidade de sitemap XML (SEO-F30)

O auditor local descarta URLs ocultas em comentários, exige a estrutura básica `urlset` e pelo menos uma `loc`, e rejeita fragmentos ou URLs diferentes da forma canônica pública. É uma verificação offline; para XML arbitrário ainda é necessário um parser normativo em homologação.

## Diretivas Googlebot (SEO-F31)

O auditor verifica `robots=none` e `meta name="googlebot"` com `noindex`, `none` ou `nofollow`; no modo estrito detecta também declarações Googlebot duplicadas. As regras se aplicam ao build HTML, não a headers HTTP de um servidor ativo.

## Análise do corpo HTML (SEO-F32)

A verificação de H1 e links internos usa o conteúdo do corpo sem comentários nem scripts/estilos. Isso impede que trechos comentados ou literais de JavaScript sejam interpretados como navegação pública. JSON-LD também ignora comentários; a análise continua estática e não interpreta visibilidade CSS.

## Limites anti-exaustão (SEO-F33)

Orçamentos internos e não expansíveis abortam a análise de builds com milhares de links por página, dados estruturados excessivos, sitemap gigantesco, robots muito extenso ou apontamentos demais. Um erro por teto excedido não é uma auditoria concluída nem libera publicação.

## Regras gerais de acompanhamento de links (SEO-F34)

`meta robots=nofollow` agora é identificado como problema de links em páginas públicas, mesmo no modo de auditoria padrão. O modo estrito continua exigindo `index,follow`.

## Validação de idioma e canonical HTML (SEO-F35)

A auditoria exige idioma `pt-BR` na abertura real da tag raiz `html`, sem aceitar strings que apenas mencionem `lang` no corpo ou JavaScript. O token `canonical` de `rel` é comparado sem distinção entre maiúsculas/minúsculas.

## Conteúdo HTML inerte (SEO-F36)

Elementos `<template>`, inclusive aninhados, são desconsiderados em verificações de títulos, H1, links e JSON-LD. Strings com sintaxe semelhante dentro de scripts não são tomadas como templates reais. O auditor continua offline e estático.

## Metadados protegidos contra HTML em scripts (SEO-F37)

Tags SEO presentes apenas dentro do texto de scripts e estilos do `<head>` não contam como metadados reais. O JSON-LD permanece analisado separadamente.

## Inventário estrito do sitemap (SEO-F38)

Na auditoria estrita de sites públicos, cada URL do sitemap deve estar em um elemento `url` com exatamente uma `loc`. URLs soltas, contêineres vazios e duplicações dentro de um contêiner geram erro. A validação não substitui um parser XML completo.

## Pré-verificação de propriedade GSC (SEO-F39)

`reviewOfflineGscPropertyPreflight` confere apenas **correspondência exata** de propriedade (domínio GSC versus URL-prefix), a partir de uma lista local fornecida pelo operador. Não autentica Google, não confirma vínculo do tenant, não concede acesso real e não revela URLs no resultado. Mesmo com correspondência e permissão declarada, mantém `productionReadAuthorized=false` até verificação independente no Portal.

## Vínculo offline entre property preflight e plano GSC (SEO-F40)

`bindOfflineGscPlanToPreflight` verifica se tenant, fingerprint da propriedade, URL oficial Google, escopo readonly e corpo da consulta são compatíveis antes da revisão por backend. Todas as saídas mantêm `productionReadAuthorized=false` e `HOLD_EXTERNAL_BACKEND_VERIFICATION`: uma lista de sites fornecida pelo operador não comprova OAuth ou grant real.

## Consulta GSC com formato restrito (SEO-F41)

O vínculo offline F40 exige agora uma lista fechada de campos do plano e do corpo da consulta e revalida datas (até 92 dias), impedindo que parâmetros extras, filtros ou datas adulteradas sejam propagados por engano ao futuro backend. Permanece sem autenticação e sem acesso ao Google.

## Proteção de origem de planos GSC (SEO-F42)

A normalização de respostas GSC fornecidas offline revalida de forma independente URL Google oficial, fingerprint da propriedade, tenant, escopo readonly, formato fechado e datas; não confia em metadados declarados do plano. Essa conferência também é reutilizada pelo vínculo F40. Não faz chamadas Google e não comprova permissão de acesso.
