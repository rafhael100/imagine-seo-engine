# SEO F207 — restrições de indexação nos cabeçalhos HTTP

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Falha reproduzida

Na RC78, a verificação F142 aceitava HTTP 200 com o HTML exatamente igual ao
build aprovado mesmo quando a resposta continha `X-Robots-Tag: noindex`.
O cabeçalho é independente dos metadados do arquivo. Assim, um proxy poderia
introduzir uma restrição sem mudar nenhum byte do HTML. A F143 propagava o
resultado como candidata à revisão humana sem sinalizar essa restrição.

Antes da alteração, os 16 novos ensaios HTTP tiveram seis controles positivos
aprovados e dez falhas esperadas: respostas restritas, ambíguas ou com expiração
programada recebiam o status permissivo anterior. Um ensaio adicional da
cadeia F143 também reproduziu a omissão. Os registros locais foram conservados
fora do repositório; todos os exemplos utilizam dados sintéticos.

## Comportamento implementado

`src/http-robots-directives.mjs` inspeciona os campos originais, preservados
por `headersDistinct`. Cabeçalhos repetidos são legítimos: `all`, `index` ou
`follow` em um campo não cancelam uma restrição em outro. O parser considera
as regras sem agente e aquelas destinadas a `googlebot`, sem aplicar à busca
geral uma restrição exclusiva de outro crawler, inclusive `googlebot-news`.
O escopo reinicia a cada campo e pode mudar em uma lista com agente explícito.

O laboratório F142 mantém a comparação exata dos bytes e passa a bloquear:

- `noindex` e `none`: `http_robots_indexing_blocked`;
- `nofollow`: `http_robots_following_blocked`;
- sintaxe não suportada/ambígua ou expiração programada por `unavailable_after`:
  `http_robots_policy_review_required`.

`nofollow` exige revisão porque altera a descoberta de links; não é descrito
como equivalente a `noindex`. Parâmetros de prévia (`max-snippet`,
`max-image-preview`, `max-video-preview`) são reconhecidos como diretivas,
sem confundi-los com nomes de crawler. `nosnippet`, `noimageindex`,
`notranslate`, `indexifembedded` e diretivas históricas não são classificados
por este recorte como bloqueio de indexação da página. Isso não significa
ausência de efeitos sobre prévias, imagens ou apresentação na busca.

Uma expiração exige revisão explícita mesmo quando sua data aparenta estar
no futuro. O parser não presume fuso, formato ou validade de uma agenda e não
concede aprovação com base no relógio do processo. Regras desconhecidas e
formas fora do recorte geram revisão, em vez de uma promessa de equivalência
com todos os parsers de mecanismos de pesquisa.

A F143 identifica o motivo agregado `served_html_http_robots_policy_blocked`.
Ela conserva o diagnóstico anterior de divergência de bytes quando esse for
o motivo. HTML idêntico continua contado como idêntico mesmo quando o
cabeçalho bloqueia a revisão, evitando atribuir alteração de conteúdo a uma
restrição exclusivamente HTTP.

## Limites e verificação

O helper trabalha apenas com até 32 campos, 8.192 caracteres e 256 segmentos.
Não retorna cabeçalhos, nomes de crawler, URLs, datas ou dados do conteúdo.
Não executa rede. As conexões continuam somente em `127.0.0.1`, com prazo
total, tamanho limitado, consentimento explícito e sem seguir redirecionamentos.

Os testes usam HTTP local real com os mesmos bytes em todos os cenários,
incluindo repetição de campos, caixa mista, escopo por crawler, regras
permissivas conflitantes, parâmetros de prévia e integração completa F143.
Controles de limites e sintaxe verificam a necessidade de revisão sem vazamento.

Esta entrega não remove nem altera diretivas de staging, não autoriza publicação,
não consulta Googlebot e não comprova indexação, GSC real ou HTTPS público.
O Nginx de homologação permanece sob os controles existentes; a implantação
real e o GO humano continuam separados da prova em laboratório.

## Fonte primária

[Google Search Central — robots meta e X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag),
consultado em 17/11/2026: uso do cabeçalho, escopo por crawler, múltiplos campos,
combinação restritiva e diferenças entre regras de indexação e de apresentação.
