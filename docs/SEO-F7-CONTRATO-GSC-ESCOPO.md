# SEO-F7 — Contrato local de relatório por tenant e propriedade

O novo adaptador `src/scoped-gsc.mjs` permite construir saídas sanitizadas para consumo **read-only** pelo Portal, sem expor dados brutos:

- `analyzeScopedGscCsv({scope,csv,startDate,endDate})` agrupa as consultas.
- `compareScopedGscCsv(previous,current)` compara somente períodos da **mesma referência de empresa e propriedade**.
- O contrato `seo-scoped-offline-v1` exporta a referência abstrata de empresa, SHA-256 da propriedade, SHA-256 da fonte, período e métricas agregadas.
- Termos de pesquisa, e-mails, número de telefone e URL da propriedade não são incluídos na saída.
- URLs da propriedade devem ser HTTPS sem usuário/senha, query ou fragmento, ou `sc-domain:dominio.com.br`.
- A autorização do operador é somente uma **declaração obrigatória**; NÃO é autenticação, verificação de propriedade nem autorização real para leitura do Google.

## Cuidados
Sem transporte, SQL, OAuth, secrets, cron ou dados reais neste módulo. Para uso multiempresa real: tokens de curta duração, autorização autenticada no Portal, RBAC, verificação de vínculo com Search Console, escopo tenant obrigatório na persistência, segregação, consentimento/registro, exclusão e auditoria LGPD. Não incluir CSV real no GitHub Actions.
