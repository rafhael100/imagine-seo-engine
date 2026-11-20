# SEO F206 — limites reais de HEAD e BODY

## Defeito reproduzido

A F205 passou a respeitar aspas e texto bruto ao inspecionar metadados, mas
`audit-static.mjs` ainda selecionava os trechos HEAD e BODY com expressões
regulares. Um `</head>` literal dentro de JSON-LD, JavaScript ou CSS encerrava
a seleção antes de uma meta Googlebot `noindex` efetiva. Com os metadados
obrigatórios antes do literal, a página podia passar indevidamente.

O mesmo problema em BODY ocultava links quebrados após um `</body>` literal
em script, atributo entre aspas ou textarea. Em título e descrição válidos,
um `</head>` literal também provocava falsos erros de metadados ausentes.

## Alteração

`extractDocumentSections` reaproveita o percurso lexical limitado da F205
para localizar as tags explícitas de abertura e fechamento de HEAD e BODY.
Valores entre aspas, comentários e conteúdo raw/RCDATA não produzem limites
falsos. O auditor chama essa extração após remover comentários e templates
inertes, preservando o tratamento separado de JSON-LD.

O contrato continua exigindo seções explícitas e o formato de fechamento
anterior. Não há reconstrução de DOM, inferência de HEAD/BODY omitidos ou
promessa de equivalência com a recuperação de HTML inválido do navegador.
Limites de bytes, tokens e diagnósticos permanecem aplicados. Não há nova
dependência, rede, saída de conteúdo privado ou mudança de formato do relatório.

## Validação

O teste `tests/head-document-boundaries.test.mjs` contém dez casos: os oito
cenários regressivos acima e dois controles de documentos saudáveis/inertes.
Executado antes da alteração sobre a RC78, em Node 24, produziu **2 sucessos
e 8 falhas esperadas**. Os casos verificam o resultado público do auditor,
sem espelhar a função de extração.

Comando da validação focada, incluindo a F205:

```sh
node --test tests/head-metadata-ambiguity.test.mjs tests/head-document-boundaries.test.mjs
```

Após a correção, a validação focada em Node 24 aprovou **34/34 testes**,
sem falhas, cancelamentos ou testes ignorados. A validação cumulativa da PR
deve continuar verificando a versão final em Node 22 e Node 24.

Somente código e testes offline. Nenhum merge, deploy, DNS, indexação,
consulta GSC ou acesso à VPS faz parte desta entrega.
