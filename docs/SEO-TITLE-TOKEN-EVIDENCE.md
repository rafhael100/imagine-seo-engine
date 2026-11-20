# Evidência de TITLE obtida do elemento real

## Problema corrigido

A seleção do título ainda aplicava uma expressão regular sobre todo o HEAD
filtrado. Um exemplo literal `<title>...</title>` dentro do valor entre aspas
de META ou LINK podia ser escolhido como o título da página. Isso permitia
aprovar uma página sem TITLE real, acusar duplicação entre títulos distintos
ou esconder uma duplicação real. Um `>` ou `</title>` dentro de atributos do
próprio TITLE também podia contaminar o texto comparado.

O auditor agora usa `extractHeadTitleText`, baseado no mesmo lexer limitado
que já distingue tags reais, atributos entre aspas e conteúdo RCDATA. O token
de texto registra onde começa seu fechamento; a extração utiliza somente os
bytes entre a abertura completa do TITLE real e esse fechamento.

Permanecem o contrato de primeiro TITLE do HEAD explícito, a normalização de
espaços e os diagnósticos `missing_title` e `duplicate_title`. Um TITLE ausente,
vazio ou sem fechamento não fornece evidência de texto. A mudança não adiciona
decodificação de entidades, inferência de HEAD omitido ou árvore DOM. A política
de BASE continua exigindo revisão explícita.

## Evidência comportamental

Na base [Engine #318](https://github.com/rafhael100/imagine-seo-engine/pull/318),
SHA `e0030209f032a1b95231d6bd208fbe84b06b2341`, os 12 casos novos de
`tests/title-token-evidence.test.mjs` apresentaram **oito falhas reproduzidas e
quatro controles aprovados**. As falhas demonstram falso aceite por atributo,
falso alerta e omissão de alerta de duplicação, além de extração incorreta do
texto quando um atributo contém `>` ou um fechamento aparente.

Com a correção, **88/88 testes focados** e **1.069/1.069 testes de `npm test`**
passaram, sem falhas, cancelamentos ou skips. O conjunto focado também cobre
as fronteiras HEAD/BODY, metadados ambíguos, H1 e navegação inerte já existentes.
Os controles preservam TITLE em maiúsculas, normalização de espaços, conteúdo
RCDATA literal e exclusão de comentários, templates, scripts e estilos.

Todos os casos usam diretórios temporários e dados sintéticos, com duas rotas
quando necessário para exercitar a detecção real de duplicação. Os resultados
não incluem texto dos títulos nos diagnósticos. Nenhuma requisição externa ou
evidência privada participa dos testes.

O lexer continua estático e não reproduz toda a recuperação de HTML malformado
do navegador. A prova local não equivale a indexação, ranking, publicação ou
validação da CI da candidata, que deve ser registrada separadamente na PR.
