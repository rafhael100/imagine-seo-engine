# SEO-F86 — Comparação orgânica com privacidade reforçada

A função `prepareOfflineGscOrganicTrendDisplay({previous,current})` e seu comando local constroem uma **prévia de comparação**, revalidando diretamente duas exportações GSC originais, e não aceitam relatórios ou recomendações calculados pelo chamador.

## O problema resolvido

O comparador legado `compareGscPeriods` remove linhas sensíveis das somas, mas ainda pode emitir comparações e sinais baseados no restante dos dados. Quando existe uma consulta privada omitida, isso pode induzir a interpretações incompletas. F86 fornece um **contrato de exibição distinto e conservador**, sem alterar o relatório técnico legado nem quebrar consumidores atuais.

- Com zero linhas ocultadas: indica `SUPPLIED_ROWS_ONLY_NOT_VERIFIED`; exibe somente métricas de categorias genéricas dos dados fornecidos (jamais afirma ser a totalidade do Google).
- Com pelo menos uma consulta protegida em **qualquer** período: indica `REDACTED_ROWS_NO_COMPARISON`; oculta totais de cliques/impressões de ambos os períodos, percentuais de variação, clusters e todas as recomendações; preserva apenas dias, linhas recebidas e número de linhas ocultadas.
- Recusa objetos com `summary` pré-calculado, campos inesperados como `oauthVerified`, chaves simbólicas, getters e arrays não convencionais. Revalida datas, janela sem sobreposição, métricas CTR e duplicações através das bibliotecas originais.
- Retorna sempre `oauthVerified=false`, `backendTenantGrantVerified=false`, `customerDisplayAuthorized=false`, `publicationAuthorized=false`, `networkPerformed=false` e `HOLD_EXTERNAL_AUTHORIZATION`.

## Uso local

```bash
node scripts/prepare-gsc-organic-trend-display-offline.mjs private-two-periods.json
```

O arquivo JSON deve conter apenas `previous` e `current`, cada um com `dimensions:['query']`, `startDate`, `endDate` e `rows`, com chaves/métricas no formato de exportação de consultas. O comando limita leitura a **10 MiB**, exige UTF-8 válido, recusa symlink final e opções extras e não ecoa caminhos ou consultas privadas em erros.

Testes Node 22/24: comparação válida, CPF redigido em período anterior ou atual, resultados vazios, input pré-computado falso, permissões falsas, janelas inválidas, arrays adulterados, symlinks, JSON corrompido, UTF-8 inválido e tamanho excessivo.

## Restrição de integração

Este modelo é **revisão offline**, não gera acesso Google, autentica tenant, verifica propriedade, armazena dados de clientes ou produz publicação. Os resultados não devem ser exibidos como painel operacional no Portal sem sessão, grants de tenant/propriedade e validação independente AppSec/LGPD/SEO. Nenhum merge em `main`, deploy, 301, cobrança ou migração foi realizado.
