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

## RC39 — nova verificação integrada

- CI Node 22/24 da candidata com as verificações novas:
  https://github.com/rafhael100/imagine-seo-engine/actions/runs/43608255358
  (**405/405 testes**, ambos ambientes).
- CI cruzado RC39 no Astro fixado do Comercial PR #385
  (commit `f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a`):
  https://github.com/rafhael100/imagine-seo-engine/actions/runs/43608255309
  (**45 páginas, zero errors/zero warnings**).
- Os 45 seletores de idiomas foram conferidos contra os destinos originais
  e a política EN/ES/PT; 26 rotas internacionais incluídas. Um link de
  bandeira intencionalmente errado foi rejeitado na cópia descartável.
- Os campos `inLanguage` do JSON-LD `WebPage` conferem com o idioma
  raiz de cada página. Nenhuma tradução foi gerada automaticamente.
- As mutações negativas de F101 e F102 passaram novamente e o HTML foi
  restaurado ao final; testes de navegador/acessibilidade do Comercial
  na execução #43606681451 também estão verdes.
- **Bloqueios objetivos e roteiro de release:**
  [SEO-RC39-RELEASE-RUNBOOK.md](SEO-RC39-RELEASE-RUNBOOK.md).
  Nenhum destes sucessos equivale à revisão independente ou ao deploy.

Os commits de documentação posteriores a esses jobs devem ser confirmados
por novos checks da HEAD exata antes de promoção.

## Gates para revisão e homologação

- [x] CI Node 22 e 24 na revisão de código com QA RC39, logs #43608255358. Após commits de documentação, validar a HEAD final novamente.
- [x] CI integrado na revisão de código RC39, logs #43608255309: build 45 páginas e mutações negativas. Repetir na HEAD final.
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
