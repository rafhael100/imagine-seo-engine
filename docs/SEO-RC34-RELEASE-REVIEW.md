# Imagine SEO Engine — RC34, revisão de integração e gate de auditoria

**Base:** [RC33 #116](https://github.com/rafhael100/imagine-seo-engine/pull/116) (`3d5ac06b02a61e63d29f70c5f781d00e11155f91`). **Incremento:** [SEO-F81 #117](https://github.com/rafhael100/imagine-seo-engine/pull/117), fonte e testes no SHA `10a649f9c448fe8412da6e8c499eec0637d9259e`.

## O que a RC34 consolida

- F0–F80: auditor estático local, comparações e contratos offline do Search Console, modelo privado de exibição F79 e CLI de revisão F80 (sem permissões de cliente).
- F81: **contagem real de ocorrências duplicadas** por `severity:type:file` no comparador de builds; o crescimento de 1 para 3 avisos iguais conta como **duas** regressões. Problemas resolvidos repetidos também entram na contagem.
- F81: validação estrita das seis opções suportadas na política de auditoria, sem getters, chaves simbólicas ou campos extras.
- F81: CLI `compare-audit-offline.mjs` exige exatamente dois arquivos e rejeita flags não reconhecidas. Nenhuma falha pode ser convertida em aprovação por opção desconhecida.

## Paridade com o Imagine Comercial

- [Comercial #233](https://github.com/rafhael100/imagine-comercial/pull/233) concluiu com sucesso o workflow de comparação de auditorias: mesma compilação Astro, resultado do auditor original SHA `bbcc198b5eb88585534c0a0374ed8c787f40e7ca` confrontado com o motor F81 SHA `10a649f9c448fe8412da6e8c499eec0637d9259e`.
- [Comercial #234](https://github.com/rafhael100/imagine-comercial/pull/234) é a candidata **em revisão** de atualização do SHA do CI do Comercial, com teste de pin e rollback pontual. Somente promovê-la após o seu CI aprovar e a revisão independente confirmar.
- RC34 não implica atualizar automaticamente o pin do Comercial para o SHA desta documentação; o código auditado e pinado em #234 continua exatamente F81, e seu hash é validado no CI.

## Aprovação e riscos

A execução de Node 22/24 na PR RC34 é obrigatória. O código F81 não depende de banco, rede, clientes, OAuth ou ferramentas pagas, mas isso **não** equivale a homologação de produção. Preservar revisão AppSec/SEO, teste do Comercial com build exato e rollback documentado.

**NO-GO:** nenhuma mudança em `main`, deploy, DNS, 301, Search Console real, tokens, IA de marketing em produção, cobranças ou clientes. Esta RC34 é uma candidata de fonte e documentação, não uma ativação operacional.
