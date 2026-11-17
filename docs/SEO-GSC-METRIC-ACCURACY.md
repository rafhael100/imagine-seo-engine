# GSC offline — identidade de consultas e precisão do limiar de CTR

## Defeitos reproduzidos

A revisão da base `3af252f33c7ef365137853f60aef84b42228d8c6` encontrou
dois problemas de cálculo nos relatórios locais:

1. O cruzamento consulta/página usava apenas minúsculas na identidade da
   consulta. `criação de sites` em NFC e NFD, embora equivalentes pela função
   compartilhada `gscQueryIdentity`, eram contadas como duas consultas. Isso
   ocultava sobreposição entre páginas diferentes e aceitava o mesmo par
   consulta/página duas vezes, inclusive entre páginas de uma resposta paginada.
2. F4 e F54 comparavam CTRs arredondados com subtração de ponto flutuante.
   Uma queda de `30/1000` para `10/1000`, exatamente 2 pontos percentuais,
   deixava de gerar o sinal previsto. Já `4001/100000` para `2002/100000`,
   queda de 1,999 ponto percentual, gerava o sinal indevidamente.

## Alterações

- F57 reaproveita `gscQueryIdentity` na identidade do par e no agrupamento.
  O limite de comprimento continua sendo conferido antes da normalização.
  Consultas compostas somente por controles invisíveis são recusadas.
  Acentos semanticamente diferentes continuam distintos; páginas diferentes
  continuam distintas. A identidade temporária não aparece no relatório.
- F4 e F54 usam `hasCtrDropOfTwoPercentagePoints` para decidir o sinal com
  os contadores originais. A comparação racional usa `BigInt` somente
  internamente, evitando perda de precisão dos produtos. A saída continua
  sendo JSON comum, sem novos campos ou valores `BigInt`.
- O limite permanece **queda de CTR maior ou igual a 2 pontos percentuais**,
  com **pelo menos 100 impressões em ambos os períodos**. A cobertura diária
  incompleta continua suprimindo os sinais. Denominadores iguais a zero não
  geram sinal de queda de CTR.
- A diferença percentual para apresentação é arredondada após subtrair
  as razões originais. Os valores de CTR apresentados no resumo diário
  mantêm quatro casas decimais, conforme o contrato existente.

Nenhuma regra de negócio, autorização, privacidade, paginação ou limiar
foi ampliada. A comparação de posição média permanece fora deste recorte.

## Validação local

Node **24.22.1**, entradas sintéticas e comandos sem conexão externa.

Antes da correção, os **32 testes novos** resultaram em **14 aprovados e
18 falhas esperadas**: nove de identidade Unicode/paginação e nove de
CTR/apresentação. Depois, os mesmos **32/32 passaram**.

```bash
node --test tests/gsc-query-page-unicode-identity.test.mjs \
  tests/gsc-ctr-threshold-accuracy.test.mjs
```

A rodada direcionada final passou **131/131 testes**, incluindo os 32 novos,
privacidade, CSV, paginação, sobreposição, comparação diária, brief e CLIs:

```bash
node --test tests/gsc-query-page-*.test.mjs tests/gsc-daily*.test.mjs \
  tests/gsc-ctr-threshold-accuracy.test.mjs \
  tests/gsc-private-query-parity.test.mjs tests/gsc-query-duplicates.test.mjs \
  tests/organic-trends.test.mjs tests/gsc-csv.test.mjs
```

A expectativa antiga do cenário F54 `60/500 -> 20/200` foi corrigida para
incluir `review_ctr_drop`: a queda é exatamente 2 pontos percentuais e o
teste anterior reproduzia o erro de ponto flutuante. As demais expectativas
existentes foram preservadas.

As regressões incluem NFC/NFD, caracteres de compatibilidade e controles
invisíveis, duplicação entre páginas de resposta, acentos distintos, valores
no limite/abaixo/acima, denominadores diferentes, contadores cujos produtos
ultrapassam o inteiro seguro de `Number`, impressões zero e cobertura parcial.

## Alcance

Os resultados descrevem somente os dados locais fornecidos. Permanecem os
campos de autorização falsos e os estados de retenção para revisão existentes.
Não há OAuth, leitura Google, tokens, clientes reais, alteração de VPS,
publicação, merge ou nova dependência nesta alteração.
