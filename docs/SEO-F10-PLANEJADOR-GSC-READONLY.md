# SEO-F10 — Contrato para futura API Search Console somente leitura

A função `planGscQuery` gera uma **descrição**, não uma chamada, da requisição oficial de Search Analytics:

- Método POST em `/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`, URL da propriedade devidamente codificada.
- Escopo OAuth mínimo: `https://www.googleapis.com/auth/webmasters.readonly`.
- Período explícito e estrito de até 92 dias, somente `type=web`, dimensão `query`, `dataState=final` e limite de 1–25.000 linhas por chamada.
- Sem `Authorization`, refresh token, API key, client secret, banco de dados, fila ou HTTP.
- `analyzeGscQueryResponse` recebe resposta *em forma de* API, valida linhas/CTR e omite consultas brutas nos indicadores.

Documentação Google: https://developers.google.com/webmaster-tools/v1/searchanalytics/query

## Dependências obrigatórias para ativar de verdade
Consentimento e permissão na propriedade GSC, criação de credenciais OAuth do projeto autorizado, callback seguro no Portal, criptografia de tokens, segregação por empresa, MFA, RBAC, auditoria LGPD, revogação/retention e rate limiting. A declaração local `authorizationConfirmed` **não substitui** autenticação ou consentimento real.

A API pode limitar ou anonimizar consultas; seus resultados NÃO equivalem a todo o tráfego.
