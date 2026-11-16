# Imagine SEO RC70 — GSC → 301 → HTTP HEAD loopback real → Astro compilado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base consolidada e evidências

A [RC69 #277](https://github.com/rafhael100/imagine-seo-engine/pull/277), commit `1ccf0a0e732935826b0456a7de1f5d1e9577c071`, passou em **60/60 workflows** e preserva o acervo territorial oficial IBGE, controle editorial municipal F179/F180, F183 prioridades GSC, F185 candidatos 301 privados e as compilações reais do Comercial.

Integra sequencialmente:
- [F186 #278](https://github.com/rafhael100/imagine-seo-engine/pull/278): um contrato que recalcula a cadeia GSC PAGE original → propostas F185 → comprovantes HTTP → destino HTML do Astro auditado; sem confiar em resumo de aprovação. Falha fechada para paginação incompleta e URLs privadas antes de abrir a pasta de build. CI sobre Comercial **F344** real, revisão imutável `873815411236ea6f0b333c5826661f177a5ad0c0`.
- [F187 #279](https://github.com/rafhael100/imagine-seo-engine/pull/279): HEADs efetivos num servidor exclusivamente `127.0.0.1`, aproveitando o capturador F138, com validação F186 contra o mesmo Astro F344 compilado. Cobertura: 301 válido, 302 incorreto, Location externo, segundo hop e HTTP 404 no destino. A F187 concluiu **3/3 workflows na SHA `02b7c72e5c7a7e783f5e9e4b3c257fb963968455`**, incluindo a suíte geral, Node 22/24 e teste com build Comercial real.

## Critérios da própria RC70

Executar novamente **toda a CI na HEAD da RC70**, incluindo os workflows territoriais IBGE 2025, CI de segurança, Chromium PT/EN/ES, revisões F183–F187, build real Comercial F344 e laboratório HEAD 127.0.0.1. Registrar falhas sem reduzir testes nem presumir GO por resultado verde.

## Limitações que não devem ser confundidas

- O laboratório HTTP em loopback **não** autentica TLS, DNS, Cloudflare, Nginx, VPS Leaseweb ou a origem de produção; os recibos do cenário de teste são coletados de um servidor sintético isolado.
- O GSC usado nas CIs é **sintético**. A conexão OpenSEO externa não transfere OAuth, grants ou consentimento ao Imagine SEO Engine. Necessários OAuth read-only por tenant/propriedade com sessão MFA, cofre de tokens e revogação, conforme [issue #14](https://github.com/rafhael100/imagine-seo-engine/issues/14).
- Permanecem pendentes conteúdo útil e oferta local por município, revisão independente AppSec/DBA/LGPD, inventário privado de URLs antigas com equivalência editorial, staging Leaseweb autorizado, backup/restauração, rollback e aceite humano específico para merge, DNS, deploy e indexação, conforme [issue #190](https://github.com/rafhael100/imagine-seo-engine/issues/190).
- O diff cumulativo é amplo; exige inventário exaustivo e revisão independente, não apenas a contagem de testes.

Nenhum serviço externo pago, assinatura ou dado de cliente é acessado por esta PR. **O status de release permanece HOLD.**
