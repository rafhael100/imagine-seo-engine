# SEO F108 — inventário de páginas municipais, consistente e privado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Recorte posterior ao
[SEO F107 #154](https://github.com/rafhael100/imagine-seo-engine/pull/154).

## Objetivo

A F107 analisava até 25 rascunhos contra até 250 páginas anteriores.
A F108 cria um segundo controle de **inventário local de até 50.000 entradas**,
para localizar repetições em um conjunto maior de páginas municipais e
suas variantes PT-BR, EN-US e ES-ES, sem depender da publicação.

Ela **não presume** que a listagem fornecida está completa ou que existe
uma página pública correspondente a cada registro.

## Formato de entrada

Arquivo JSON privado:
- sourceType: operator_local_inventory_unverified
- entries: de 1 a 50.000 registros com:
  - serviceSlug, ibgeCode, state
  - locale: pt-BR, en-US ou es-ES
  - canonicalPath: caminho relativo padronizado com barra final
  - contentSha256: hash declarado do conteúdo editorial

O manifesto não contém texto da página, nomes, contatos, leads ou
informações de cliente. O arquivo local é limitado a 16 MiB e não permite
campos extras. Exemplo de comando:

    node scripts/review-geo-inventory-offline.mjs private-inventory.json

## Verificações

- Repetição da mesma combinação serviço + código municipal + idioma
- Reutilização do mesmo caminho canônico por entradas diferentes
- Mesmo SHA-256 declarado para múltiplas entradas (sinal conservador de
  conteúdo repetido, a exigir investigação editorial)
- Contagens totais e até 200 conflitos apresentados somente com índices,
  sem revelar caminhos, códigos municipais ou hashes

O relatório é **corrections_required** se houver colisões ou
**human_editorial_review_required** caso não haja colisões observadas.
Ambos os casos mantêm indexação e publicação desativadas.

## O que não está comprovado

- O código de sete dígitos **não** prova município IBGE oficial,
  correspondência UF/município ou cobertura nacional.
- O digest foi declarado por um operador e não foi revalidado contra
  conteúdo hospedado; textos semanticamente duplicados com hashes
  diferentes não são identificados.
- A relação de páginas pode estar incompleta.
- SEO, ranking, demanda, disponibilidade local, consentimento,
  autoria, publicação e indexação permanecem sem verificação.

A próxima integração deverá combinar a F107 (conteúdo de rascunhos)
com este inventário amplo e uma fonte municipal oficial, sem usar o
resultado como autorização de publicação.

## Testes

    npm test

Inclui inventários com mais de 5.700 entradas, detecção multilíngue,
colisões por município e caminhos, limite de conflitos, entradas
adulteradas, payload com getter/símbolo, saída privada e CLI.

**Nenhuma consulta de rede, chamada Google, criação de URL ou
alteração em main, VPS, DNS e dados de clientes.**
