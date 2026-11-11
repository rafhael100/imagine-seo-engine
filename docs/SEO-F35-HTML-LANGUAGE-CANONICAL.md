# SEO-F35 — Raiz HTML e token canonical

Problemas corrigidos no auditor estático:
- Uma ocorrência de `lang="pt-BR"` em qualquer texto dos primeiros 3.000 caracteres era suficiente para passar a verificação, mesmo que o elemento `html` estivesse sem idioma.
- O atributo `rel="CANONICAL"` de um link válido podia ser rejeitado por diferença de maiúsculas/minúsculas.

Agora somente a tag raiz `html` é considerada para idioma, com exatamente um atributo `lang` definido como `pt-BR` de forma insensível à caixa. O valor de `rel` também é tokenizado e comparado de forma insensível à caixa.

Sem rede, OAuth, publicação, dados reais de clientes ou interpretação DOM completa.
