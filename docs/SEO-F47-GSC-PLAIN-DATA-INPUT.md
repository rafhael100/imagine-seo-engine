# SEO-F47 — Entradas do planejador GSC somente com dados próprios

O contrato do planejador `planGscQuery` aceita apenas objetos simples (protótipo padrão ou nulo) com chaves próprias e descritores de dados. Recusa campos herdados, propriedades acessoras/getters, símbolos e chaves não enumeráveis desconhecidas, evitando que propriedades invisíveis para `Object.keys` ou getters disparem comportamento não esperado na preparação de consultas.

Testes adversariais sintéticos validam os casos de recusa e o caso positivo de objeto com protótipo nulo. Esta validação não substitui serialização segura no backend nem autenticação de usuário.

HOLD obrigatório: não há OAuth, acesso Google, armazenamento de tokens, leitura real de dados, deploy, merge main ou autorização de produção. Revisão independente e integração com Portal permanecem pendentes.
