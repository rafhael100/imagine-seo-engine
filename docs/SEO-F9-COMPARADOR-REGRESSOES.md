# SEO-F9 — Comparador offline de regressões SEO de builds estáticos

A função `compareStaticAuditReports(before,after,policy)` compara duas saídas JSON do auditor offline. Pode ser utilizada antes de atualizar a referência pinada do Imagine Comercial.

## Política padrão (falha fechada)
- Nenhum erro ou aviso no build atual.
- Nenhum alerta novo, de qualquer categoria.
- Sem redução do número de páginas HTML públicas.
- Identifica problemas resolvidos, sem reproduzir mensagens livres que podem conter URLs ou outros dados internos.

O CLI local `node scripts/compare-audit-offline.mjs antes.json agora.json` termina com código de saída 1 se o gate reprovar. O contrato é `seo-audit-regression-v1`, sem tráfego, rastreamento, produção, rede ou deploy.

## Limites
- Dados de entrada são relatórios fornecidos pelo operador e podem ser incompletos/adulterados.
- Mesmo tipo de problema no mesmo arquivo é considerado igual, ainda que a mensagem mude.
- Redução no total de páginas é uma barreira conservadora, não detecção de quais URLs mudaram.
- A integração de CI do Comercial pode usar o comparador somente após revisão e pin de SHA; este PR não altera o Comercial nem publica alterações.
