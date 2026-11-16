# SEO-F24 — Contrato entre motor SEO offline e futuro Portal

`preparePortalSeoHandoff` recebe um brief `seo-brief-offline-v1` e identificadores sintáticos de tenant, fingerprint de propriedade e commit revisado.

**Saída:** `seo-portal-review-handoff-v1`, composta só de métricas agregadas, ações em allowlist e a origem **não verificada**. Entrada extra (consultas, nomes de arquivos, propriedades, tokens, afirmações de autorização) é descartada. O estado é sempre `HOLD_EXTERNAL_AUTHORIZATION`; tanto exibição a clientes como publicação permanecem falsas.

A execução da CLI `scripts/prepare-portal-handoff-offline.mjs` é local e não faz rede.

**Controle obrigatório fora do motor:** autenticação real da sessão no Portal, RBAC/MFA, concessão por tenant, verificação Google Search Console/OAuth, consentimento documentado e trilha LGPD. Um SHA isolado não é prova de assinatura ou procedência.
