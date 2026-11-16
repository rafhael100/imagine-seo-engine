# SEO-F5 — Importação local do CSV de Consultas do Google Search Console

## Entregas
- Suporte aos cabeçalhos `Top queries`, `Queries` ou `Principais consultas`, em inglês ou português; métricas Clicks/Cliques, Impressions/Impressões, CTR, Position/Posição.
- CSV com separador vírgula ou ponto e vírgula, texto entre aspas, UTF-8 BOM, decimal por ponto ou vírgula e CTR com sinal de porcentagem.
- Exige início e fim do período como entradas **explícitas**; a exportação CSV por consulta normalmente não identifica a janela no próprio arquivo.
- Analisador existente agrega por marca, temas e serviço, omitindo consultas brutas e filtrando padrões de dados pessoais.
- Pode comparar dois períodos CSV de duração equivalente. Nenhuma conexão Google, segredo OAuth ou armazenamento persistente.
- Erros nos campos ou totais inconsistentes bloqueiam a importação em vez de inventar dados.

## Execução
`node scripts/report-gsc-csv-offline.mjs export.csv 2026-11-01 2026-11-08`

`node scripts/compare-gsc-csv-offline.mjs anterior.csv 2026-10-01 2026-10-07 atual.csv 2026-10-08 2026-10-14`

## Limites
- Apenas a aba/tabela de *consultas*, não as exportações de páginas, dispositivos, regiões ou aparências de pesquisa.
- Máximo de 10 MiB e 100 mil linhas; não representa todos os acessos do site devido a limitação/anonimização da fonte.
- CSV é processado localmente: não enviar conteúdo de usuários ou consultas brutas aos logs do GitHub.
- Datas, propriedade do Search Console, filtros e procedência precisam ser informados e verificados por alguém autorizado.
- Antes de produzir relatórios empresariais oficiais, validar propriedade e escopo, configurar acesso OAuth e adequar retenção/LGPD.

PR draft e sem merge em main, sem dados reais, custos ou deploy.
