# Imagine SEO RC48 — migração segura e pré-validação de mensuração

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY — 15/11/2026.**

Esta revisão consolida a RC47 [#187](https://github.com/rafhael100/imagine-seo-engine/pull/187) e a F130 [#188](https://github.com/rafhael100/imagine-seo-engine/pull/188). Não autoriza qualquer operação no ambiente do cliente.

## Entregas integradas

- Fundamentos SEO F0–F126: auditoria de HTML, GSC offline privativo, inventário municipal PT/EN/ES, integridade, 3x3 hreflang, relatórios Ed25519 v2 em laboratório e interoperabilidade comprovada com o Portal RC50 #896.
- Migração F127–F129: auditoria de URLs antigas HTTP/HTTPS e www/apex, /en-us/ para novas rotas com revisão editorial, recusa de open redirect/loops e CLI que confronta as propostas com HTML compilado real.
- Mensuração F130: metadados mínimos GA4 (stream e key events) não verificados pelo Engine, sinalização de ausência de `generate_lead`, proibição de usar `purchase` como prova de cliente CRM; estágios de visitas, leads e clientes permanecem não preenchidos.

### Evidências pré-consolidação

- RC47 SHA `27f49387c325cbbb5cb028ecf3915acca8bdca32`: **12 de 12 workflows SUCCESS** em Node 22/24, incluindo auditorias Astro, multilíngue e migração.
- F130 SHA `aa960ec1cadfa1a90f477ced68ea37b8708bec0b`: [teste específico](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43792754908) e [regressão geral](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43792754864) **SUCCESS**.

A HEAD exata desta RC48 exige execução da CI novamente. Não usar checks antigos como autorização de produção.

## Dependências operacionais

1. **Site Comercial:** a calculadora F331 [#417](https://github.com/rafhael100/imagine-comercial/pull/417) é demonstrativa, anônima e sem coleta. **Não** emitir `generate_lead` ao calcular uma previsão; só considerar o evento após lead realmente recebido no CRM, consentimento e confirmação autorizada.
2. **Analytics:** validar propriedade/stream GA4, configurar `generate_lead` como key event quando existir fluxo real, inspecionar disparos com ferramentas Google e evitar qualquer PII em analytics. A conexão da conta pelo OpenSEO não equivale ao OAuth de produção do Imagine Portal.
3. **CRM/Portal:** identidade tenant, consentimento e eventos reais de lead e cliente com deduplicação e trilha auditável. O site não deve inferir cliente a partir de clique GSC ou evento GA4 de compra.
4. **SEO migratório:** fonte IBGE oficial, QA editorial e traduções aprovadas, redirecionamentos reais HTTP 301 (www/apex, legado de idiomas), canonical, sitemap e hreflang após implantação autorizada.
5. **VPS/segurança:** isolamento Leaseweb, backup/restore/rollback, KMS/segredos, revisão independente AppSec/DBA/LGPD, inventário integral do diff histórico, autorização formal para deploy.

**Estado de release: HOLD.** CI/laboratório não substituem teste de staging autenticado, nem autorização de publicação de páginas territoriais ou relatórios de clientes. `main` segue intocada.
