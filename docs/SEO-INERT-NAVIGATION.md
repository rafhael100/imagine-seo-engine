# SEO — navegação e fragmentos usam somente tags reais

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Defeito reproduzido

Na base `066da386771e1bd6cf597f2839eb5f1ca8826821`, texto com aparência de
âncora dentro de `textarea`, `xmp`, `iframe` e atributos entre aspas podia
criar uma aresta no grafo de navegação. Uma página que deveria ser marcada
como órfã e inalcançável recebia zero avisos. Texto com aparência de ID
também satisfazia indevidamente links de fragmento ou duplicava um ID real.

O filtro lexical preservava corretamente esses intervalos, mas o auditor
voltava a percorrê-los com expressões regulares que confundiam texto com
elementos. Mais de mil exemplos de âncoras dentro de um textarea podiam até
esgotar o limite reservado à navegação real.

## Correção

`iterateOpeningHtmlTags` reaproveita `htmlRanges` e expõe somente nome e
markup das tags de abertura. Para elementos raw/RCDATA, retorna a abertura
real, incluindo seus atributos, sem expor o conteúdo textual como tags.
Conteúdo entre aspas permanece dentro da tag que contém o atributo.

As coletas de âncoras e IDs locais do auditor usam esse percurso sobre o
BODY já filtrado. Um ID na abertura real de um textarea continua válido;
um ID escrito como exemplo dentro dele não entra no inventário. Links e
IDs reais posteriores ao conteúdo inerte continuam sendo inspecionados.

Os limites anteriores de tokens, tags, âncoras e navegação permanecem.
Exemplos textuais não consomem o orçamento de âncoras reais. A resolução de
URLs relativas e o bloqueio explícito de BASE href da entrega anterior
continuam em vigor.

## Validação

Os **28 testes novos** reproduziram **19 falhas esperadas e 9 controles
aprovados** antes da correção. Após a mudança, **28/28 passaram** em Node
24.22.1. A regressão direcionada passou **227/227** e a suíte cumulativa
`npm test` passou **1.043/1.043**, sem falhas, cancelamentos ou testes ignorados.

Os casos incluem textarea, xmp, iframe, noembed, noframes e title/RCDATA;
atributos de div e de uma âncora real; falsa conectividade; falsos IDs;
fragmentos e IDs reais; links posteriores; duplicação de IDs; falso href
JavaScript; mil exemplos inertes e os limites reais de âncoras e tokens.
Toda a validação desta etapa usa arquivos locais sintéticos.

## Limites

O helper recebe HTML com comentários e templates já filtrados. Ele não
reconstrói DOM nem implementa toda a recuperação de HTML malformado. O
parser de atributos e as análises de H1, metadados e JSON-LD não foram
ampliados por esta correção. Não há consulta externa, dados de clientes,
OAuth, publicação ou alteração na VPS.
