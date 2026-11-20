# Declarações HTML não fornecem evidência de elementos

## Defeito reproduzido

Na base [Engine #322](https://github.com/rafhael100/imagine-seo-engine/pull/322),
SHA `18212b09d6f923e4d3f79065f99e8a4ae9b3ff68`, o lexer compartilhado tratava
comentários `<!-- ... -->`, atributos entre aspas e conteúdo raw/RCDATA como
faixas opacas. Outras sequências `<!` e `<?` viravam texto e permitiam que uma
abertura aparente, ainda dentro da declaração, fosse reconhecida como elemento.

Este fragmento sintético fazia uma página sem SCRIPT real passar pela
verificação de presença de JSON-LD:

```html
<!DOCTYPE html SYSTEM '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization"}</script>'>
```

O primeiro `>` encerra o DOCTYPE, mesmo dentro do identificador entre aspas.
A abertura aparente de SCRIPT pertence ao DOCTYPE; o texto JSON posterior não
tem um SCRIPT real que o contenha. O mesmo defeito foi reproduzido com
`<!audit ...>` e `<?audit ...?>`. A página de controle sem schema apresentava
`missing_jsonld`; as três variantes fictícias eliminavam esse aviso.

A mesma fronteira incorreta também podia fornecer TITLE, idioma da raiz,
metadados, canonical, H1, links e IDs inexistentes. Fechamentos aparentes de
HEAD/BODY escondiam restrições de indexação ou links quebrados posteriores.
Aberturas e fechamentos aparentes de TEMPLATE alteravam o filtro de conteúdo
inerte. Scripts fictícios inválidos geravam `invalid_jsonld` e podiam consumir
o orçamento dos scripts reais.

## Correção compartilhada

Depois da regra já existente de comentários e antes da leitura de tags,
`htmlRanges` reconhece `<!` e `<?` como uma faixa opaca até o primeiro `>`
inclusive, ou até EOF se não houver fechamento. O limite não usa o leitor
de atributos: aspas não prolongam essas declarações. A varredura retoma
imediatamente depois da faixa, permitindo reconhecer os elementos reais
seguintes, inclusive antes de uma aspa ou sufixo aparente da declaração.

A faixa recebe uma categoria própria, preservada por `filterStaticHtml`.
Assim, as passagens posteriores reconhecem o mesmo delimitador, sem expor
pseudo-tags nem criar markup novo por remoção e concatenação de fragmentos.
Os consumidores de tags, JSON-LD, idiomas, títulos e seções HEAD/BODY ignoram
essa categoria. Comentários normais conservam sua regra anterior; os ranges
raw/RCDATA e de atributos reais continuam opacos.

O contador compartilhado continua anterior ao novo ramo: cada declaração
consome um evento do limite de 50.000. Permanecem os limites externos de
2 MiB por HTML, 128 scripts JSON-LD reais por página e os demais orçamentos.
Não há dependência nova, execução de JavaScript ou reconstrução do DOM.

## Validação

`tests/html-declaration-evidence.test.mjs` reúne **35 casos sintéticos**.
Antes da correção, **32 falharam e três controles passaram**. Depois da
correção, **35/35 passaram**, assim como **277/277 testes focados** dos
consumidores do lexer e da suíte geral do auditor. A execução de `npm test`
aprovou **1.156/1.156 testes**, sem falhas, cancelamentos ou skips.

Os controles incluem retomada após o primeiro `>` dentro de texto entre
aspas, elementos reais ausentes, HEAD/BODY, TEMPLATE, EOF, comentários,
raw/RCDATA, atributos, scripts fictícios sem consumir o orçamento real e
recusa de 50.001 declarações. A revisão independente do diff não encontrou
bloqueios. A candidata ainda precisa de CI própria antes da promoção do pin
no Comercial.

## Referência e escopo

O [HTML Standard, tokenização](https://html.spec.whatwg.org/multipage/parsing.html#tokenization)
define a distinção entre declaração, comentário e elemento. O
[estado bogus comment](https://html.spec.whatwg.org/multipage/parsing.html#bogus-comment-state),
os estados de identificador DOCTYPE
[SYSTEM](https://html.spec.whatwg.org/multipage/parsing.html#doctype-system-identifier-(single-quoted)-state)
e [PUBLIC](https://html.spec.whatwg.org/multipage/parsing.html#doctype-public-identifier-(single-quoted)-state),
e o [estado de dados de processing instruction](https://html.spec.whatwg.org/multipage/parsing.html#processing-instruction-data-state)
encerram esses tokens ao encontrar `>`. A classificação de `<?audit ...>`
como processing instruction na norma atual não muda essa fronteira lexical.

O auditor mantém seu contrato estático de HTML com HEAD/BODY explícitos.
Não implementa construção de árvore, namespaces de conteúdo estrangeiro,
parsing XML ou toda a recuperação de documentos malformados. Os testes usam
somente conteúdo sintético local; não comprovam rastreamento, indexação,
ranking ou alterações em produção.
