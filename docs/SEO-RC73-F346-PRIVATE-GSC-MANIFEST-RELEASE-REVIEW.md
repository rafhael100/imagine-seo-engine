# Imagine SEO RC73 — migração Comercial F346 e custódia privada do GSC

**CANDIDATA DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Entregas acumuladas

A [RC72 #287](https://github.com/rafhael100/imagine-seo-engine/pull/287) concluiu **63/63 workflows** na SHA `a4b68442b147d6bbd293c9532b2a53f21a032e29`: mantém o conjunto cumulativo de IBGE 2025 oficial, filtros editorial/territorial F179–F184, GSC PAGE privado F183/F185/F186, captura HEAD real em loopback F138/F187, builds comerciais F336/F344/F346, proteção Nginx F189, revisão completa Git F188, isolamento Docker e navegação Chromium.

Esta RC73 integra de modo incremental:

- [F192 #288](https://github.com/rafhael100/imagine-seo-engine/pull/288), SHA `7bbac0aa338e2bccddae231ed1a49634f0880367`: CI de comparação **Comercial F344 → F346** por commits imutáveis, dois builds Astro reais, auditorias F162/F166 de canonical/hreflang/sitemap/robots, conferência de páginas perdidas, revisão HTML PT/EN/ES e **Chromium Playwright nativo do F346**. Foram aprovados 2/2 workflows.
- [F193 #289](https://github.com/rafhael100/imagine-seo-engine/pull/289), SHA `4d41d2c917c46f74c389dc91f7dfd275d4958a50`: o F185 não emite **nenhum manifesto 301** quando o GSC PAGE tem `hasMore=true`, ainda que a exportação parcial contenha URLs plausíveis. CLI recusa colocar arquivo de GSC de entrada ou manifesto de saída dentro de **qualquer checkout Git**, incluindo worktree/submódulo, valida propriedade/permissão POSIX da pasta e do arquivo, bloqueia symlinks e sobrescrita. Três workflows foram aprovados, incluindo F167 sobre Astro real.

A integração conserva as correções F186/F187/F191 e não substitui o teste F190 F336→F344. Os dados de teste Google são sintéticos; **a propriedade real acessível via OpenSEO continua separada da autenticação do Engine**.

## Verificação da própria RC73

Não usar as CIs verdes anteriores como liberação. Esta candidata deve demonstrar **todos os workflows que dispararem nesta HEAD final com SUCCESS**, incluindo Chromium PT/EN/ES F346, comparações F344→F346, F167/F185/F193, HEAD loopback F187, F188/F189, fontes IBGE e isolamento de CI/Docker. Coletar a SHA final e contagem; se houver falha, corrigir sem descartar testes.

## Bloqueios reais para GO

1. Conceder OAuth `webmasters.readonly` e autorização por tenant/propriedade efetivos no Portal e SEO Engine, incluindo consentimento, MFA/RBAC, cofre de tokens, retenção, revogação e auditoria. Não transplantar OAuth da conexão OpenSEO.
2. Exportar o conjunto completo GSC PAGE em **arquivo privado fora do checkout**, sem paginação restante; revisar equivalência editorial de cada URL histórica `http/www/en-us` antes de aplicar 301.
3. Homologar publicamente somente depois de staging Leaseweb autorizado e isolado, com TLS e status 301 reais, canonical/hreflang, firewall, inventário de portas, backup/restauração e rollback observado.
4. Obter revisão independente de AppSec/LGPD e conteúdo municipal realmente original com serviço local comprovado. DTB oficial não comprova cobertura comercial.
5. Receber decisão humana específica para merge, deploy, DNS, indexação e qualquer cobrança.

**CIs aprovadas demonstram engenharia, não publicação. Nenhum merge, deploy, DNS, Google API real, escrita de anúncios ou indexação foi executado pela RC73.**
