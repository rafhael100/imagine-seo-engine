# Imagine SEO Offline RC27 — F0–F63

A RC27 reúne toda a RC26 (F0–F62) e o contrato paginado **v2** da F63, que passa a explicitar `pageSize` e `lastPageRows`, permitindo ao Portal conferir matematicamente os totais, a continuidade e o truncamento da última página. O contrato anterior v1 fica fixado nas branches antigas para garantir upgrade controlado, sem modificação silenciosa de consumo.

Evidências: [RC26 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42981008801) e [F63 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42981270863). O futuro consumidor Portal v2 deve passar por CI independente antes de liberar qualquer migração.

**HOLD:** a candidata é offline e não opera Search Console no backend Imagine. Sem dados reais em Git, OAuth próprio, concessão IAM de produção, DNS, redirects, custos novos, merge main ou deploy. Revisão independente e homologação permanecem necessárias.
