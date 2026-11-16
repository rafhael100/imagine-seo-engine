# SEO F118 — distinguir municípios de unidades administrativas especiais

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F117 #166](https://github.com/rafhael100/imagine-seo-engine/pull/166), cuja captura HTTPS está bloqueada por indisponibilidade do endpoint no runner CI. A F118 independe de conectividade.

## Motivação

Uma linha da API de localidades não é, por si só, prova de que corresponde a um município autônomo. O IBGE diferencia, na Malha Municipal 2025, **5.569 municípios**, **Distrito Federal**, **Distrito Estadual de Fernando de Noronha** e **duas áreas estaduais operacionais**.

Fonte oficial: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html

O IBGE informa também os códigos de Brasília (DF) `5300108` e Fernando de Noronha (PE) `2605459`.

- https://www.ibge.gov.br/cidades-e-estados/df/brasilia.html
- https://www.ibge.gov.br/cidades-e-estados/pe/fernando-de-noronha.html

## Código novo

A reconciliação de rascunhos F110, também utilizada pelo gerador de prévias F112, reconhece esses dois geocódigos como **unidades administrativas especiais que exigem decisão editorial própria**.

Para esses itens a saída recebe exclusivamente o código categórico `known_special_territorial_unit_requires_separate_editorial_review`, sem revelar o nome ou o código local, e mantém status **blocked** para a rota genérica municipal. Uma pessoa autorizada poderá definir uma estratégia de página apropriada por processo específico — não há aprovação automática.

Um registro dessas áreas no **inventário existente** incrementa uma contagem, mas não bloqueia a revisão de outros municípios válidos do lote. Isso evita bloquear todo o site pela presença legítima de Brasília ou Fernando de Noronha.

O resultado sempre declara `legalMunicipalityClassificationVerified=false`, porque não consulta uma malha territorial assinada ou um cadastro jurídico completo.

## Validações

A suíte `npm test` cobre ambos os códigos especiais, a ausência de conteúdo privado nos relatórios, a não geração de HTML privado para novas páginas especiais e a manutenção das revisões de municípios comuns.

## Limites

A lista de unidades especiais **não é exaustiva**. As duas áreas operacionais não recebem classificação automática por esses dois códigos; nenhuma unidade pode ser considerada município apenas por não constar na lista curta. É necessário cotejo independente da edição territorial e parecer editorial antes de gerar/publicar páginas nacionais.

Nenhuma requisição externa, alteração em `main`, publicação, deploy, DNS ou dado de cliente.
