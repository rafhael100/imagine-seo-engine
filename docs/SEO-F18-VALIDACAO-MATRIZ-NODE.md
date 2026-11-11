# SEO-F18 — Gate de compatibilidade antes do release

O mesmo conjunto de testes offline é executado em Node 22 e Node 24 através da matriz GitHub Actions.

- Token de execução com permissão `contents: read` somente.
- `fail-fast: false`: falha em uma versão não impede diagnosticar a outra.
- Sem token Google, segredos, dependências de fornecedores, deploy ou mudança na `main`.
- Atenção: o workflow atesta os testes do repositório; o CI do Imagine Comercial e as integrações reais continuam fora do escopo.

A atualização da baseline de SEO no site comercial deverá apontar para commit validado, com revisão e planejamento de rollback.
