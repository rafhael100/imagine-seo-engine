# SEO F180 — vincular municípios oficiais ao catálogo comercial real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Continua a [RC66 #268](https://github.com/rafhael100/imagine-seo-engine/pull/268) e a F179, que já verifica município/UF/nome contra o cadastro DTB oficial de 2025 autenticado por SHA.

## Problema comercial

Uma cidade pode existir no IBGE e um texto local pode ser original, mas isso não significa que o produto oferecido na página exista no catálogo vigente da Imagine. O sistema deve impedir que um slug inventado ou um serviço ainda em preparação seja transformado em página comercial indexável.

## Implementação

O módulo `src/geo-comercial-service-catalog-gate.mjs` valida uma lista de serviços proveniente do `src/data/services.mjs` da revisão **F336** do Imagine Comercial:

`0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38`.

Somente os produtos iniciais **Onepage** (`onepage`) e **Landing Page** (`landing-pages`) são elegíveis para triagem editorial desta fase. Isso não afirma que a Imagine atende automaticamente uma cidade específica; são apenas serviços presentes no catálogo e no escopo inicial definido. Outros produtos, inclusive ofertas futuras ainda não homologadas, exigem nova aprovação de escopo antes de serem planejados como páginas locais.

A rotina recomputa o filtro de qualidade F107 a partir do lote original e rejeita catálogo com duplicatas, slugs inválidos ou ausência de serviços iniciais. O contrato final `reviewPinnedMunicipalServiceDrafts` combina **F179 + F180**, exigindo o CSV DTB oficial por hash, códigos/UF/nomes corretos e catálogo comercial analisado. Nenhum relatório ou flag declarativo é aceito como autorização.

## Prova técnica

- A CI F180 faz checkout somente leitura da revisão Comercial F336, verifica `git rev-parse HEAD`, importa o catálogo original e valida o escopo inicial. Testes de entradas maliciosas e serviços inexistentes executam em Node 22/24.
- A CI F172 existente, que já baixa o ZIP IBGE oficial e gera o CSV privado normalizado, foi estendida para fazer checkout da mesma revisão Comercial F336 e executar o contrato **combinado** sobre um rascunho de laboratório sem disponibilidade/demanda. Uma única captura oficial por rodada, sem exportar planilhas ou conteúdos.
- A saída revela apenas quantidade de produtos, quantidade de rascunhos e quantos foram bloqueados; não revela cidades, origens de leads, textos, tokens ou dados de cliente.

## Limites

A existência do produto no catálogo não comprova disponibilidade de atendimento no município, autorização contratual, status de contratação, consistência de preços, elegibilidade da conta ou direito de exibir anúncios. São necessárias autorização por tenant, comprovação de oferta local, revisão humana da qualidade e migração segura antes de qualquer URL indexável.

Nenhum merge, DNS, deploy, cobrança ou indexação é realizado.
