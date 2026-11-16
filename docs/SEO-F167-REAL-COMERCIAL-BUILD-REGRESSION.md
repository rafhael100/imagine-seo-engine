# SEO F167 — comparação real de duas versões Astro do Imagine Comercial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

Integra as entregas paralelas de regressão [F162 #244](https://github.com/rafhael100/imagine-seo-engine/pull/244) e [F166 #249](https://github.com/rafhael100/imagine-seo-engine/pull/249) à [RC62 #248](https://github.com/rafhael100/imagine-seo-engine/pull/248).

## Evidência adicional

A CI compila **duas revisões imutáveis do Imagine Comercial** em checkout temporário de GitHub Actions:

- F335: `c33008d335901ba8aa1f5455f681bc4df13f45d7`, anterior à correção Chromium.
- F336: `0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38`, correção de fragmento e auditoria de links aprovada.

Os builds são gerados por `npm ci` e `npm run build`, depois auditados separadamente com o SEO Engine real. O comparador valida HTML, canonical, metadados, sitemap, hreflang, quantidade de páginas e aumento de categorias de revisão. Saída contém apenas somatórios e códigos permitidos. Nenhum caminho privado, HTML ou consulta GSC deve aparecer no relatório.

A checagem **falha** se o conjunto de páginas mudar, se surgirem novas categorias de problemas, se os hashes de origem não forem exatos ou se o conteúdo compilado divergir. Um sucesso significa apenas ausência de nova regressão agregada detectada neste par de builds.

## Segurança e limitações

Nenhum crawler público, autorização GSC, arquivo IBGE, token, cliente real, VPS, DNS, merge ou indexação é usado. Build de CI não prova comportamento na produção, SEO orgânico, equivalência da migração histórica nem autorização de publicação.

Continuam pendentes autenticidade IBGE/DTB, revisão editorial, redirects antigos HTTP/www/en-us, GSC por tenant, revisão AppSec/LGPD, homologação Leaseweb, backup/restore, rollback e GO humano.
