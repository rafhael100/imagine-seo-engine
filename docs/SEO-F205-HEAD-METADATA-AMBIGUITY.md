# SEO F205 — metadados de head sem falsos positivos de indexação

## Problema reproduzido

O leitor genérico de atributos usava o último valor entre aspas e ignorava valores sem aspas. Com isso, uma segunda ocorrência podia ocultar `noindex` ou uma canonical errada; texto editorial com `>` ou com aparência de tag também confundia a leitura.

O primeiro commit contém somente regressões: SHA `d13d5fcd7976d65d7dc3daaba20cd6d97f2aa0c8`, [CI antes da correção](https://github.com/rafhael100/imagine-seo-engine/actions/runs/44181718676). Node 22 e 24 reproduziram nove falhas; 858 demais testes passaram, incluindo o novo controle positivo de head saudável.

## Mudança

`src/head-metadata-attributes.mjs` inspeciona lexicalmente as tags meta/link do head já filtrado pelo auditor. Respeita valores entre aspas e sem aspas, limites da tag, texto de title e duplicações dos atributos críticos. Tags ambíguas produzem `ambiguous_head_metadata` e não podem fornecer evidência positiva de canonical, robots, Googlebot, descrição, og:url ou marcador de preview.

O diagnóstico é genérico e não reproduz valores, domínios ou texto editorial. O resumo executivo encaminha a ocorrência como `high / review_page_metadata`. O leitor genérico de atributos do restante do HTML permanece separado. O validador estrito de hreflang continua recebendo a marcação original, inclusive a inválida, para preservar seus códigos de recusa e sua exigência de aspas.

## Referências e limites de leitura

O [padrão HTML](https://html.spec.whatwg.org/multipage/parsing.html#attribute-name-state) mantém o primeiro atributo de um nome e descarta duplicados; o auditor recusa explicitamente a ambiguidade. [Atributos sem aspas são sintaxe HTML válida](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2).

Referências de caracteres são decodificadas uma única vez nos campos de controle. Há suporte explícito a referências numéricas ASCII com ponto e vírgula e a `amp`, `lt`, `gt`, `quot`, `apos`, `Tab` e `NewLine` (incluindo as variantes listadas no código). Outras representações em campos críticos exigem revisão e geram erro; conteúdo editorial de descrição permanece literal. Não se pretende substituir um parser DOM completo ou inspeção em navegador. Mantidos os limites globais do auditor, com teto adicional de 128 atributos por tag e 50.000 tags de head.

## Validação

A suíte inclui duplicatas de content/name/href/rel, ambas as ordens relevantes, Googlebot sem aspas e codificado, decodificação simples sem recursão, prosa entre aspas, title RCDATA, atributos colados e teto por tag. A integração Nginx/Comercial F197 agora é acionada também por alterações do auditor e do novo helper. Resultados da HEAD final e revisão: [PR #307](https://github.com/rafhael100/imagine-seo-engine/pull/307).

DRAFT / NO-GO / NO-MERGE / NO-DEPLOY. Auditoria offline de arquivos e dados sintéticos, sem Google/GSC real, VPS, DNS, clientes ou indexação.
