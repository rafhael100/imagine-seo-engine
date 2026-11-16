# SEO F143 — homologação local integrada, incluindo os bytes servidos

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de F142 [#209](https://github.com/rafhael100/imagine-seo-engine/pull/209) e RC52 [#208](https://github.com/rafhael100/imagine-seo-engine/pull/208).

## Novo critério técnico

O relatório técnico agora exige **quatro camadas coerentes**, em ordem controlada:

1. F133/F128 — insumos GSC privados por página, inventário 301, conteúdo estático realmente compilado, sitemap, canonical/hreflang.
2. F140 — fingerprint SHA-256 de todo build local versus header anunciado pelo proxy HEAD em `127.0.0.1`.
3. F139/F141 — HEAD do host legado e do destino aprovado apenas no mesmo loopback, sem seguir Location, verificando 301/200, e o digest após os testes.
4. F142 — **GET dos bytes HTML realmente servidos** por cada uma das rotas do inventário, comparados ao SHA-256 dos arquivos HTML correspondentes; verifica novamente o SHA de todo build ao final.

Falha ou ausência de qualquer componente bloqueia. Para dados sintéticos bons, retorna apenas `human_independent_served_html_staging_review_required`, não GO nem publicação. Se a camada F141 falhar, F142 não inicia solicitações de GET. Sem leitura HTTP pública ou emissão de tokens Google.

## Comando único (somente ambiente isolado)

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-served-html-staging-qa.mjs \
  --gsc /AREA-PRIVADA/gsc-pages.json \
  --manifest /AREA-PRIVADA/legacy-plan.json \
  --build /AREA-PRIVADA/build \
  --out /AREA-PRIVADA/http-receipts.json \
  --port 18290 --enable-loopback-probe
```

Porta **meramente ilustrativa**: o operador deve inventariar contêineres e comprovar isolamento e porta livre; não invadir listeners do CRM, Portal ou Sites. O output no console é redigido (contagens), enquanto os comprovantes privados (URLs, resultados HEAD) ficam em arquivo `0600` não sobrescrito, fora do Git.

O proxy de staging precisa servir HTML sem compressão para esses testes, com `Content-Type: text/html`, `Accept-Encoding: identity`, `GET` 200, sem inclusão dinâmica, e anunciar a versão correta do build. Não ajustar a produção para satisfazer artificialmente um teste de laboratório.

## Segurança e bloqueios externos

Mesmo com o conteúdo GET idêntico, o proxy controlado pelo operador não é autenticado criptograficamente por esse método. `Host` e `X-Forwarded-Proto` são simulação lógica — **não verificam TLS/SNI, DNS, Cloudflare ou HTTPS público**. O GSC/GA4 continua externo ao executor; não confundir conexão de OpenSEO com grants por tenant do Portal.

Faltam IBGE oficial, conteúdo editorial por município, equivalência de rotas, OAuth/escopo/consentimento, revisão AppSec/DBA/LGPD, execução autorizada em staging Leaseweb, backups/restauração, rollback e autorização humana de deploy.

A suíte de CI usa somente servidor HTTP local, arquivo HTML sintético e rotas fictícias; testa byte idêntico e divergente, 302, header incorreto, ausência de HTML e contenção de dados privados.
