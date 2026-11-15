# Imagine SEO RC43 — release candidate integrada, sem autorização de implantação

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Esta branch foi criada a partir do HEAD testado da [integração #168](https://github.com/rafhael100/imagine-seo-engine/pull/168).

## Escopo acumulado
- [RC42 #165](https://github.com/rafhael100/imagine-seo-engine/pull/165): validação do HTML gerado, segurança contra publicação de prévias internas e cross-check do inventário municipal.
- [F117 idiomas #167](https://github.com/rafhael100/imagine-seo-engine/pull/167): correspondência do idioma declarado no inventário com `html lang` real do arquivo compilado, inclusive EN/ES do Astro.
- [F117 IBGE #166](https://github.com/rafhael100/imagine-seo-engine/pull/166): captura HTTPS do endpoint fixo de municípios do IBGE, hash SHA-256 e recibo privado de integridade.
- [Integração #168](https://github.com/rafhael100/imagine-seo-engine/pull/168): união das alterações em branch isolada, regressões na HEAD e separação explícita entre validação determinística e disponibilidade do serviço externo.

## Evidências já obtidas na integração anterior
- Node 22/24: CI local passou.
- Política offline de captura IBGE e recibo: testes passaram, sem credenciais.
- **Verificação HTTPS real do IBGE: NÃO APROVADA.** Uma tentativa do runner em 15/11/2026 terminou em `curl exit 28, HTTP 000` e `official_source_transport_unavailable`. Após a separação de gates, o job de captura online fica **skipped** em PRs e exige execução explícita `workflow_dispatch`. Isto não é prova de fonte.
- O formato JSON correto e o hash do recibo não autenticam assinatura de edição territorial ou cobertura completa dos municípios.

## Gates de homologação
1. Captura HTTPS efetiva da fonte oficial, com dados íntegros, data/edição revisada e aceitação documental.
2. Revisão da segurança do capturador, incluindo ausência de redirects, SSRF, tokens, respostas excedentes e tratamento de falhas.
3. Conferência de idiomas e clusters hreflang em build de homologação, não apenas no commit fixado do Comercial.
4. Comprovação de atendimento local, conteúdo editorial genuíno e auditoria de duplicações/doorway pages.
5. Portal/Sites com identidade, MFA, autorização editorial por empresa e fluxo de publicação reversível.
6. OAuth GSC readonly real, consentimento, grants vivos/revogação e proteção de tokens; CRM/Analytics autenticados.
7. Teste na VPS com HTTPS, isolamento, backup/restauração, logs, CDN e rollback.
8. Revisão AppSec/DBA/LGPD e aceite explícito de implantação.

## Não fazer
Nenhum `main`, DNS, VPS, Google real, faturamento, indexação, publicação de HTML privado ou dados de clientes deve ser alterado por esta PR. A aprovação da CI offline não satisfaz o gate externo.

**ReleaseStatus: HOLD_REAL_IBGE_PROVENANCE_AUTHENTICATED_PORTAL_AND_STAGING.**
