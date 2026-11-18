# Contagem de H1 por tags reais do documento

## Defeito e correção

O auditor contava H1 por expressão regular depois de remover comentários,
templates, scripts e estilos. O conteúdo de `textarea` e outros elementos de
texto, além de atributos entre aspas, continuava nessa entrada. Um exemplo
literal `<h1>` podia aprovar uma página sem H1 real ou acusar duplicação numa
página com um único H1.

A contagem agora usa `iterateOpeningHtmlTags`, o mesmo lexer limitado já usado
para âncoras e IDs. Somente tokens cujo nome é `h1` entram no total. Os dois
helpers antigos de regex, sem outros consumidores, foram removidos.

A regra existente do auditor permanece: exatamente um H1 real por rota
auditada, com o diagnóstico `heading_count` e a contagem observada em caso de
divergência. Não houve mudança de política editorial, parser, limites ou
interpretação de robots, metadados, links e sitemap.

## Evidência antes e depois

Na base [#317](https://github.com/rafhael100/imagine-seo-engine/pull/317), SHA
`bc7aa7f78e1b85af9b287ec01229db5c31733575`, a nova suíte
`tests/heading-token-count.test.mjs` produziu **oito falhas exatas
`ASSERT_REAL_H1_COUNT` e seis controles aprovados**. As falhas incluem falso
aceite e falso bloqueio por RCDATA, texto bruto e atributos, além da contagem
incorreta de dois H1 reais acompanhados de um exemplo inerte.

Depois da correção, **14/14 casos focados e 1.057/1.057 testes de `npm test`
passaram**, sem falhas, cancelamentos ou skips. Os controles preservam zero,
um e dois H1 reais, nomes em maiúsculas, exclusão de comentários/templates/
scripts/estilos e uma tag real após o fechamento de texto bruto.

Os testes exercitam `auditStaticSite` em diretórios sintéticos descartáveis,
com HTML, canonical, robots, JSON-LD e sitemap válidos. Nenhum dado de cliente
ou chamada externa participa da prova. A execução da CI da candidata deve ser
registrada na PR; não foi criado outro workflow.

O lexer continua sem reconstruir a árvore DOM ou toda a recuperação de HTML
malformado do navegador. A mudança corrige a contagem no contrato estático
existente; não comprova ranking, publicação ou efeito nas páginas em produção.
