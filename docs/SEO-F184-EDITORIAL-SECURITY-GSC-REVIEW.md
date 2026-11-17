# SEO F184 — consolidação de segurança editorial e priorização de migração

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Integração sem refazer entregas

Consolida em uma única árvore sobre a [RC67 #270](https://github.com/rafhael100/imagine-seo-engine/pull/270):

- [F181 #271](https://github.com/rafhael100/imagine-seo-engine/pull/271): arrays privados de até 6.000 rascunhos são inspecionados pelos descritores de índices próprios. Rejeita buracos, getters, símbolos e atributos extras sem executá-los.
- [F182 #272](https://github.com/rafhael100/imagine-seo-engine/pull/272): o comparador territorial público aceita apenas `Map` nativo de linhas ordinárias, descritores seguros e campos `state`, `city` e `index` opcional. Rejeita subclasses, getters, metadados ocultos e dados adulterados. O wrapper da fonte oficial DTB continua exigindo a SHA completa F172.
- [F183 #273](https://github.com/rafhael100/imagine-seo-engine/pull/273): risco de migração HTTP/www/en-us priorizado por impressões do GSC PAGE e cobertura de candidatos 301, sem expor dados originais.

Os quatro arquivos da F181/F182 foram comparados com a RC67 e os ajustes são aditivos ou de endurecimento estrito: `src/geo-national-template-review.mjs`, `tests/geo-national-template-review.test.mjs`, `src/geo-pinned-official-editorial-gate.mjs`, `tests/geo-pinned-official-editorial-gate.test.mjs`.

## Aceite de integração

Executar a CI geral Node 22/24, os testes F168/F179/F183, e a validação F172 do cadastro real oficial **na HEAD desta PR**. É proibido aceitar regressão de editorial, quebra de SHA F172, liberação de conteúdo municipal ou permissão para indexação. Nenhum teste deve executar código de getters privados nem revelar URLs ou conteúdo original.

## Estado operacional

O catálogo inicial segue Onepage e Landing Page; autorização de Search Console por tenant no próprio Engine, disponibilidade comprovada dos serviços por cidade, revisão independente AppSec/LGPD, redirecionamentos reais, backup/restauração e rollback na Leaseweb continuam pendentes. A ausência de regressões de CI não equivale a autorização de release.
