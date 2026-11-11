# SEO-F67 — Bloqueio de tendências com linhas ocultadas

A comparação offline entre períodos F65/F66 rejeita **sinais de tendência e delta de sobreposição** quando qualquer janela contém linhas GSC ocultadas por privacidade (parâmetros de URL ou outras linhas suprimidas). A proporção calculada sobre linhas visíveis pode mudar artificialmente com a ocultação; nenhuma inferência confiável deve ser gerada nesses casos.

- `coverageComplete=false`, `coverageStatus=REDACTED_GSC_ROWS_NO_SIGNALS`, `overlapShareChange=null` e `reviewSignals=[]` se `redactedRows>0` em qualquer período.
- Quando não há ocultações, permanece a proteção existente para paginação potencialmente incompleta.
- Contagens e proporções visíveis seguem disponíveis apenas para inspeção offline, nunca como prova de canibalização.
- Testes usam somente termos e URLs sintéticos, inclusive marcador sigiloso não retornado.

Sem OAuth real, Google HTTP, dados privados em Git/CI, autorização de exibição, publicação, DNS, deploy ou merge na `main`. Revisão independente e CI permanecem gates externos.
