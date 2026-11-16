# SEO-F46 — Contrato fechado para a entrada do planejador GSC

O planejador offline `planGscQuery` agora rejeita qualquer chave fora do conjunto explícito `tenantRef`, `siteUrl`, `startDate`, `endDate`, `authorizationConfirmed`, `rowLimit` e `startRow`. Também rejeita entrada nula, listas e valores não-objeto.

Isso evita que sinalizadores arbitrários como `oauthVerified`, `networkPerformed`, `tenantGrant`, `scope`, `dimensionFilterGroups` ou `searchType` sejam silenciosamente ignorados e posteriormente interpretados como autorização. A declaração `authorizationConfirmed` continua sendo **apenas uma declaração do operador**, não verificação Google nem consentimento autenticado.

A suíte sintética ganhou cobertura adversarial de chaves adicionais e tipos inválidos, além de preservar o caminho válido com limites explícitos.

**Operação:** apenas cálculo local, sem rede, tokens, Google real, acesso a clientes, custos, deploy ou alteração em `main`. A etapa permanece em HOLD até a autenticação OAuth readonly, grants/RBAC/tenant e revisão independente do Portal.
