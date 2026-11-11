# SEO-F45 — Metadados GSC fechados e data final

O normalizador GSC offline considera válido `metadata: {}` ou ausência de `metadata`. Recusa campos desconhecidos e a **presença** de `first_incomplete_date` ou `first_incomplete_hour`, mesmo com valores nulos, vazios ou falsos: a etapa nunca deve interpretar marcadores incompletos adulterados como confirmação de dados finais.

Os testes F45 são sintéticos. Não há chamada Google, tokens, permissões, dados de clientes, produção ou escrita. `HOLD` e a verificação real OAuth/tenant/consentimento permanecem obrigatórios para eventual integração.
