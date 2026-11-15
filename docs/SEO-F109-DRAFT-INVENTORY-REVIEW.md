# SEO F109 — triagem editorial de rascunhos contra inventário amplo

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continuação da [F108 #155](https://github.com/rafhael100/imagine-seo-engine/pull/155).

## Objetivo

A F107 examina a qualidade e semelhança do conteúdo local de até
25 rascunhos. A F108 inspeciona inventários de até 50 mil páginas,
mas usa apenas metadados e hashes. A F109 combina **as entradas
originais** desses dois contratos, sem aceitar resultados previamente
fabricados com a alegação de "aprovado".

É uma etapa anterior à revisão editorial humana, não um publicador.

## Controles executados

Para cada rascunho F107 o sistema:
- reexecuta regras de conteúdo local e comparações com até 250
  rascunhos/páginas de referência
- lê a combinação serviço+código municipal+idioma a partir do
  inventário amplo F108
- trata rascunhos F107 exclusivamente como **pt-BR**; en-US e
  es-ES precisam de um contrato próprio, nunca deduzido
- compara SHA-256 do texto original do rascunho com hashes
  declarados do inventário (igualdade exata, não semântica)
- impede promoção quando o inventário fornecido possui colisões
  internas não resolvidas
- recusa todos os campos de permissão ou resumos prontos fornecidos
  por terceiros

## Execução

Sem usar qualquer API externa:

    node scripts/screen-geo-drafts-inventory-offline.mjs private-drafts.json private-inventory.json

O primeiro JSON é a entrada original F107 (máximo 512KiB). O segundo
é a entrada original F108 (máximo 10MiB). A saída possui apenas
índices de rascunhos, categorias de conflito e contagens. Não
contém conteúdo, cidade, URL, CPF, contato, hash ou credencial.

Os resultados são **blocked** ou **human_editorial_review_required**.
Mesmo sem conflito, publishingAllowed=false, indexationAllowed=false
e customerDisplayAuthorized=false em todas as entradas.

## Limites

O inventário continua fornecido pelo operador, pode estar incompleto
e não foi reconciliado com páginas hospedadas. A comparação de hash
detecta apenas identidade exata do corpo de texto; não garante
originalidade editorial ou ausência de páginas doorway.
A existência/UF de municípios não foi validada oficialmente no
IBGE. Atendimento local e demanda real não estão comprovados.

Antes de publicar, ainda são obrigatórios aprovação editorial
independente, inventário real completo, IBGE e conteúdo local legítimo,
consentimento/LGPD quando necessário, controle de indexação e
testes SEO de entrega e rollback na hospedagem.

## Testes

    npm test

Cobre conflitos cross-inventory, conteúdo exato, estados
de inventário inválidos, locais distintos, separação de idiomas,
campos de privilégio falsificados, dados pessoais e saída privada
do CLI.

**Sem geração de conteúdo, novas URLs, Google, CRM, VPS,
DNS, merge ou deploy.**
