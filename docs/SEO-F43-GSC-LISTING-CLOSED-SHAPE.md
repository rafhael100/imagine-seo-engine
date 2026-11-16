# SEO-F43 — Inventário GSC com formato fechado

O inventário de propriedades Google fornecido pelo operador é **não autenticado**. Cada item deve conter **exatamente** `siteUrl` e `permissionLevel` — nenhuma flag extra como `oauthVerified`, `authorization`, `tenantRef` ou campos desconhecidos é aceita.

## Critérios

- Rejeitar campos adicionais ou ausentes, inclusive flags que simulem autorização.
- Manter correspondência exata de propriedades e validação das permissões declaradas.
- Não expor URLs de propriedades em mensagens de erro nem nos resumos.
- Preservar `productionReadAuthorized: false`, `oauthVerified: false` e `HOLD`.
- Execução exclusivamente local e sintética: sem rede, tokens, OAuth, consultas Google, dados reais ou gastos.

## Verificação

Executar `npm test` no CI Node 22/24. Revalidar integração com Comercial antes de atualizar versão pinada no projeto consumidor. PR não deve ser mesclada em `main`, publicada ou implantada automaticamente.
