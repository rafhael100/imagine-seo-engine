# SEO-F77 — Gate de regressão contra chamadas de rede em módulos offline

A suíte Node passa a inspecionar todos os módulos `.mjs` diretamente em `src/` e `scripts/`, recusando padrões de chamadas Web `fetch`/WebSocket/XMLHttpRequest/EventSource e importações explícitas dos módulos de rede do Node (`http`, `https`, `net`, `tls`, `dns`, `dgram`, `http2`) e `undici`, inclusive import dinâmico com nome literal.

O gate também rejeita symlinks ou entradas inesperadas com sufixo `.mjs` nos diretórios examinados. Testes artificiais confirmam que padrões de rede são recusados, enquanto leitura de arquivo local e uso de `URL` como parser não são proibidos.

**Limitação:** verificação estática por padrões, **não** é sandbox de execução, firewall, auditoria de dependências ou comprovação de ausência de acesso à rede. Importações construídas dinamicamente e APIs indiretas podem exigir inspeção manual. O gate serve para bloquear erros acidentais em arquivos de código sob CI e reforçar a política offline.

Sem credenciais, dados reais, Google HTTP, deploy, publicação, merge na main ou despesas.
