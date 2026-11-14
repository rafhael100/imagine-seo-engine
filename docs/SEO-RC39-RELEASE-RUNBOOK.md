# RC39 — Passagem para revisão independente e autorização de release

**Data de referência:** 14/11/2026. **Escopo:** Imagine SEO Engine offline RC39
+ Imagine Comercial Astro multilíngue em CI.

**Decisão atual:** `NO-GO` para merge, staging real ou produção. CI verde
não substitui revisão independente, aprovação de negócio ou controles de
infraestrutura. O objetivo é oferecer um roteiro verificável sem exigências
falsamente marcadas como concluídas.

## Revisions imutáveis e evidências

| Entregável | Revisão verificada | Evidência |
| --- | --- | --- |
| Comercial, código e HTML Astro | `f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a` | PR #385; CI #43606681451 |
| Comercial, PostgreSQL sintético | mesma SHA | CI #43606681426 |
| SEO Engine RC39 (com QA dos 45 seletores) | `dabaf8624fb70e025b8c2e6ef3c0e537bdcd02d5` | CI Node #43608676982 e integração #43608676996 |
| SEO Engine RC38 de base | `50d56a6febc674fada8a04bbe513e7fddc62551d` | PR #129 |

Links de revisão:
- https://github.com/rafhael100/imagine-seo-engine/pull/147
- https://github.com/rafhael100/imagine-comercial/pull/385
- https://github.com/rafhael100/imagine-seo-engine/actions/runs/43608676996
- https://github.com/rafhael100/imagine-comercial/actions/runs/43606681451

A documentação do candidato pode avançar em commit posterior; nesse caso,
a HEAD exata deve ser validada novamente. Os SHAs da tabela são o congelamento
de **evidência de código** desta verificação, não permissão de release.

## Verificações técnicas já executadas

- [x] 408 testes offline em Node 22 e Node 24, RC39, incluindo segurança do workflow cross-repo.
- [x] Build real do Astro em runner descartável e inventário de 45 páginas:
      26 EN/ES, 0 erros e 0 avisos do auditor.
- [x] Links `hreflang`: destino, canonical, locale, reciprocidade e paridade
      dos clusters `x-default`.
- [x] `hreflang` bloqueia atributos duplicados ou não cotados.
- [x] 45 seletores de idioma: URLs PT/EN/ES esperadas, marcação de locale
      ativo em páginas traduzidas, acessibilidade nominal e WebPage JSON-LD.
- [x] Mutação temporária de cluster dividido, `href` duplicado e bandeira
      espanhola com URL errada; cada uma bloqueada e restaurada.
- [x] Contratos, navegação e acessibilidade do Comercial na PR #385.
- [x] Workflow cross-repo bloqueia refs mutáveis, GitHub Actions sem SHA revisado, permissões elevadas e comandos de deploy.
- [x] O código desta integração está em PRs Draft; sem deploy ou merge.

## Impedimentos constatados por leitura do GitHub

- [ ] A PR SEO #147 não possui revisão humana independente registrada.
- [ ] A PR Comercial #385 não possui revisão humana independente registrada.
- [ ] A branch `main` do SEO Engine estava marcada `protected: false`
      na leitura de 14/11/2026. Recomenda-se exigir proteção, checks e
      aprovações antes de liberar merges.
- [ ] A linha de PRs SEO RC38→RC39 ainda não foi promovida à `main`;
      não confundir `mergeable` do GitHub com aprovação de release.
- [ ] A comunicação pública EN/ES e seus termos devem ter revisão editorial
      do responsável da Imagine; auditoria HTML não prova tradução boa.
- [ ] Infraestrutura de staging real, autenticação, backup/rollback, controles
      de Cloudflare/DNS e a origem dos dados GSC não foram verificados
      nesta entrega.

## Roteiro seguro para o responsável pelo release

1. **Congelar escopo:** confirmar qual SHA RC39 e qual SHA Comercial serão
   promovidos. Se algum arquivo de código/workflow mudou após o CI, repetir
   as verificações na HEAD exata.
2. **Revisão independente:** solicitar revisão das PRs #147 e #385 por
   pessoa com contexto de AppSec/SEO. Verificar parser HTML heurístico,
   cadeias de PRs, alterações de workflows e supply chain fixado em SHA.
   Registrar comentários, decisões e aprovação formal no GitHub.
3. **Revisão editorial:** validar todos os 13 grupos PT/EN/ES, inclusive
   nomes, CTAs, textos sobre valores e campanha, contato, bandeiras e
   fallback de artigos sem tradução. Não gerar equivalências falsas.
4. **Proteger `main`:** ativar regra que bloqueie push direto, requeira
   CI e pelo menos uma revisão independente, de acordo com a governança
   adotada; confirmar permissão de administração e conflitos de regras.
5. **Homologar em staging privado:** antes do release, verificar origem,
   autenticação, acesso permitido, `noindex`/perímetro privado, build
   exato, configuração Cloudflare, links e respostas HTTP em domínio
   controlado. Não indexar staging ou expor contratos.
6. **Backup e rollback:** inventariar artefatos, hash SHA-256 e versão
   anterior; testar restauração antes de publicar. Aprovar plano de
   revogação/rollback sem mexer em DNS/301 de forma implícita.
7. **Promoção de PRs empilhadas:** só com checks e aprovações da HEAD
   final, em ordem de dependências. Registrar a diferença real entre
   branches e preservar a origem revisada.
8. **Validação pós-deploy:** testar HTTP público, canonical e `hreflang`,
   troca de idioma, sitemap/robots, navegação, acessibilidade e integridade
   dos assets; acompanhar incidentes e acionar rollback se necessário.
9. **Search Console:** qualquer OAuth real exige autorização da
   propriedade, escopos mínimos, isolamento por tenant, política LGPD
   e segredos protegidos. Nenhum teste offline fornece esses grants.

## Critério explícito de conclusão

A **RC39 como candidata offline** está tecnicamente validada em CI quando
todos os jobs da SHA exata ficam verdes. O **release público** só estará
concluído após os passos 2–8, com aprovação separada; integração GSC
é produto/etapa distinta que requer autorização própria. O trabalho
documental não substitui revisão humana nem acesso a staging/produção.

**Estado final deste documento: NO-GO / DRAFT / NO-MERGE / NO-DEPLOY.**
