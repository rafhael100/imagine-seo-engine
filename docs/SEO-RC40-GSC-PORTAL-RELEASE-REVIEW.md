# Imagine SEO Engine — RC40 (F103–F104 + prova Portal PHP)

**Candidata de revisão offline**, 14/11/2026, baseada na RC39
`81dfe565d71f9aa5303f7988d6eb40d5a6cc9c63`. Consolida
sem merge as alterações F103 e F104 sobre F0–F102.

## Entregas

| Etapa | Finalidade | Referência |
| --- | --- | --- |
| F103 | Bloqueia `x-default` que conduz a outro grupo de traduções; mantém fallback independente | [PR #148](https://github.com/rafhael100/imagine-seo-engine/pull/148) |
| F104 | Consome somente snapshots diários agregados do OpenSEO, com escopo exato e sem grants | [PR #149](https://github.com/rafhael100/imagine-seo-engine/pull/149) |
| Portal | Consome DTO F104 com PHP somente em CLI de teste, três cenários e falsificações de identidade/autorização bloqueadas | [Portal PR #771](https://github.com/rafhael100/imagine-portal/pull/771) |

## Evidência automatizada de código já verificada

- SEO F104 SHA `ec1739621b20860f729c59d9863ba1b341da43e8`.
  [Node22/24 — #43614837890](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43614837890):
  **420/420 testes em cada versão**.
- [Astro real do Comercial — #43614837896](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43614837896):
  **45 páginas, 0 erros e 0 avisos**, com testes de mutação negativa
  F101, F102, F103 e restauração do build descartável.
- [Portal Node/PHP — #43618814683](https://github.com/rafhael100/imagine-portal/actions/runs/43618814683):
  3 cenários sintéticos do DTO F104: completo, parcial, vazio.
  **49 mutações negativas** rejeitadas, 5 caminhos permitidos na branch,
  SHA SEO imutável no checkout; sem tokens, SQL ou rota pública.
- [Portal PHP 8.3/8.4 — #43618814333](https://github.com/rafhael100/imagine-portal/actions/runs/43618814333)
  e [Node 22/24 — #43618814311](https://github.com/rafhael100/imagine-portal/actions/runs/43618814311):
  ambos aprovados na candidata Portal #771.

**Essas execuções comprovam as SHAs mencionadas, não necessariamente a HEAD
desta RC40 após documentação.** Reexecutar CI e conferir HEAD exata.

## Status de integração com GSC

Em 14/11/2026 o conector OpenSEO mostrou o projeto Imagine SEO Engine com
`sc-domain:imaginecomunicacao.com.br` selecionado e permissão
`siteOwner`. Essa é uma propriedade conectada **ao OpenSEO**, não
OAuth próprio ou autorização por tenant dentro do Portal Imagine.
O adaptador F104 não consultou essa propriedade; os testes usam
`sc-domain:example.com` e apenas dados sintéticos.

## Gates ainda não resolvidos

- [ ] CI Node22/24 e Astro cross-repo na HEAD exata da RC40.
- [ ] Revisão independente AppSec, SEO, LGPD e conteúdo internacional.
- [ ] Proteção da branch main (observada sem proteção em 14/11).
- [ ] Fluxo Laravel real de sessão e MFA, propriedade GSC, autorização
      por tenant e consentimento com trilha de auditoria.
- [ ] Autenticação Google OAuth readonly própria do SaaS, cofre de
      segredos, revogação, retenção e mecanismo de rotação.
- [ ] Consumo de DTO autorizado no Portal sem confiar em dados de
      operador como prova de origem; ainda não existe rota de produção.
- [ ] Homologação staging com acesso autenticado, isolamento PostgreSQL,
      backups, restauração/rollback e avaliação de segurança.
- [ ] Revisão editorial PT/EN/ES do Comercial e aprovação formal de release.

A conclusão automatizada desta candidata não significa conclusão de
um **SaaS SEO de produção**, indexação garantida, rankings ou liberação de
dados a clientes. Não publicar páginas municipais em massa sem evidência
e revisão editorial.

**Estado: DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
