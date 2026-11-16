# SEO-F48 — Integridade de cada página de resposta GSC offline

O agregador `analyzeGscPaginatedResponses` rejeita propriedades extras, símbolos, getters e protótipos inesperados nos envelopes de página, além de rejeitar campos extras em cada linha. A presença de qualquer marcador `first_incomplete_date` ou `first_incomplete_hour` nos metadados interrompe a agregação inclusive se o valor for nulo, falso ou vazio. Apenas `metadata: {}` ou sua ausência são aceitos.

Regras existentes de offset, ordenação, unicidade e limite de páginas permanecem. Os testes usam exclusivamente dados sintéticos. O adaptador não autentica o Google, não consulta a API, não armazena tokens, não publica resultados e não habilita produção.

A F48 exige CI e revisão independente antes de qualquer integração posterior.
