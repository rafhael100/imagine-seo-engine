# SEO F192 — regressão Comercial F344 → F346 em Astro real e Chromium

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Dependência técnica coberta

A [RC72 #287](https://github.com/rafhael100/imagine-seo-engine/pull/287) consolidou os controles anteriores (63/63 workflows SUCCESS) e já examina o HTML real do Comercial F346 na cadeia GSC/301/HTTP F186/F187. Entretanto, o comparador de regressão F190 continuava cobrindo a transição **F336 → F344**, e a validação HTML F191 não executa necessariamente o navegador **da própria revisão F346** dentro do SEO. É necessário comparar o par realmente adjacente e preservar os gates existentes, sem refazer funcionalidades.

## Workflow de revisão independente

A CI F192 faz checkout somente leitura de dois commits exatos do repositório `rafhael100/imagine-comercial`:

- F344 (base): `873815411236ea6f0b333c5826661f177a5ad0c0`
- F346 (candidata): `9c4b29c168ef0d53abfbf44e64c404fbcc8dc01a`

Exige `git rev-parse HEAD` idêntico para ambos, instala dependências dos lockfiles e compila os dois sites Astro reais. Reutiliza:

- `scripts/compare-astro-builds-offline.mjs`: comparação F162/F166 de auditorias com canonical, hreflang, meta robots, sitemap, famílias de erro e contagem de rotas.
- `scripts/review-two-astro-route-migration.mjs`: bloqueio de desaparecimento silencioso de páginas.
- `reviewPinnedCommercialF346Build`: leitura dos arquivos HTML reais nas três localidades, CTAs e simulador comercial.
- `npm test`, `check:dist` e `test:browser` do próprio Comercial F346 com Chromium Playwright e verificações de acessibilidade.

Não se altera a CI F190 F336→F344 nem os testes de F186/F187. O navegador e todas as dependências são temporários na CI. Nenhum endereço público, cliente, token Google ou servidor da Leaseweb é acessado pelo código do SEO para ler dados reais.

## Interpretação do resultado

A saída verde só valida os commits exatos e a jornada anônima implementada. Qualquer mudança de rota, regressão técnica ou falha de navegador bloqueia a promoção até análise e correção, mesmo se o Comercial mais recente parecer funcional.

A atualização do pin comercial em workflows anteriores será avaliada somente após comparação independente, evitando que múltiplos ambientes de QA apontem para versões divergentes sem revisão.

**Restam:** OAuth GSC por tenant com consentimento no Portal/SEO Engine, revisão independente de AppSec/LGPD, homologação TLS/301 na VPS Leaseweb, backup/restauração, rollback e GO humano antes de merge, DNS ou indexação.
