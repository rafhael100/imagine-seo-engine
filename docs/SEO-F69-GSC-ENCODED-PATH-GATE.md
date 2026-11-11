# SEO-F69 — Proteção de caminhos codificados e duplo decoding

F62/F64 bloqueiam normalizações ambíguas, mas ainda aceitavam caminhos com bytes de controle codificados (por exemplo, `%00`) e `%25` (que pode introduzir uma segunda camada de percent-decoding). Em dados GSC `query,page`, esses aliases não devem ser tratados como páginas confiáveis nem como linhas meramente ocultadas.

A F69 recusa todos os caminhos que contenham `%00` a `%1F`, `%7F` ou `%25`, sem retornar o URL original. O bloqueio ocorre antes da interpretação `URL` e antes de atualizar as métricas. O filtro existente continua recusando pontos e barras codificados e mantendo espaços codificados `%20` permitidos.

Testes sintéticos para chamadas individuais e paginação, inclusive variantes com query string. Nada é conectado ao Google, armazenado em Git como dado real, publicado, enviado para produção ou mesclado em `main`.
