# SEO-F53 — Comando local para séries diárias

Execute `node scripts/report-gsc-daily-offline.mjs /caminho/privado/date-series.json` com arquivo local privado que contenha **exatamente** `scope` (tenantRef, propertyFingerprint, startDate, endDate, rowLimit opcional) e `response` (linhas `date` compatíveis com a F52).

O leitor limita entrada a 1 MiB, rejeita symlinks finais, JSON inválido, campos extras e argumentos desconhecidos. Erros não reproduzem trechos de dados nem caminhos privados. A saída contém apenas métricas por dia e cobertura com dias não reportados. Não incluir exportações reais em GitHub/CI.

Esta CLI **não** faz chamadas ao Google, OAuth, verificação de propriedade, consentimento ou grant do Portal. Toda saída permanece `HOLD`, e apenas fixtures sintéticas são usadas nos testes. A conexão de propriedade existente no OpenSEO é independente deste módulo. Sem deploy, gastos ou merge `main`.
