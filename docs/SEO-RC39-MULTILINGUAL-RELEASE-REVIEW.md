# Imagine SEO Engine — RC39 multilíngue (candidata DRAFT / NO-GO)

## Escopo consolidado

Candidata de revisão de código baseada na RC38, reunindo F99–F102 em ordem
sequencial, **sem promoção automática para main ou ambientes reais**.

| Etapa | Mudança | PR |
| --- | --- | --- |
| F99 | `--multilingual` habilita pt-BR, en, es, en-US e es-ES em HTML raiz | #142 |
| F100 | `--check-hreflang` verifica canonical local, idioma e retorno recíproco | #144 |
| F101 | Cada página de um grupo anuncia o mesmo conjunto de alternates, inclusive x-default | #145 |
| F102 | Bloqueio de rel/href/hreflang duplicados ou sem aspas | #146 |

O comportamento padrão sem flags continua exigindo raiz `pt-BR`.
A auditoria multilíngue é opt-in e não gera traduções, páginas municipais
ou redirecionamentos.

## Evidência automatizada conferida em 14/11/2026

- F102 / Node 22 e 24: 405/405 testes em
  https://github.com/rafhael100/imagine-seo-engine/actions/runs/43606535688
- F102 / Astro real do Comercial, SHA fixa
  `2f9c65f613859a4105395370672de0b5c88132b4`:
  45 HTML, 0 errors, 0 warnings:
  https://github.com/rafhael100/imagine-seo-engine/actions/runs/43606535693
- Testes negativos (em `dist` descartável): grupo hreflang dividido
  rejeitado pela F101 e href duplicado rejeitado pela F102; restauração
  do HTML ao final com auditoria limpa, sem alteracão de fontes.
- Comercial pinado para F102 apenas em branch de QA, PR #385,
  SHA `f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a`:
  https://github.com/rafhael100/imagine-comercial/actions/runs/43606681451
  (CI principal e navegador aprovados); banco de laboratório:
  https://github.com/rafhael100/imagine-comercial/actions/runs/43606681426

Esta documentação resume execuções **anteriores**. Uma execução consolidada
da HEAD exata da RC39 ainda é obrigatória antes de qualquer promoção.

## Gates para revisão e homologação

- [ ] Validar a HEAD exata da RC39 em Node 22 e 24.
- [ ] Reexecutar o build Astro real imutável e os cenários de mutação negativa
      contra a HEAD exata da RC39.
- [ ] Revisão independente de AppSec e SEO da heurística HTML (não parser DOM
      normativo), segurança do GitHub Actions e variantes linguísticas.
- [ ] Revisão editorial de conteúdo PT/EN/ES, links de bandeiras, UX,
      acessibilidade, metadados e `x-default` de cada equivalência.
- [ ] Conferir publicação protegida em staging controlado, rollback, backups,
      inventário de rotas e integridade pós-build.
- [ ] Aprovação separada dos responsáveis antes de merge/deploy.
- [ ] Se houver conexão GSC real, exigir consentimento OAuth readonly,
      grants verificáveis por tenant/propriedade, LGPD e gestão segura de
      credenciais; os dados offline não fornecem essa autorização.

## Restrições

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY**.
Sem alterar `main`, criar páginas em massa, mudar DNS, 301, Search Console,
Asaas, clientes, infraestrutura ou cobrança.

O sucesso em CI não comprova ranking, tráfego, indexação, consentimento
de acesso Google nem condições para produção.
