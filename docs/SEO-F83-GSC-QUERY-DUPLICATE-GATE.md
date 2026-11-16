# SEO-F83 — Garantia de unicidade de consultas nos exports GSC

## Problema

Quando a exportação do Google Search Console está filtrada **somente pela dimensão `query`**, cada consulta exata deve aparecer no máximo uma vez no mesmo intervalo. A implementação anterior aceitava múltiplas linhas idênticas e somava seus cliques/impressões. Isso poderia **duplicar tráfego aparente e distorcer as comparações orgânicas** sem qualquer alerta.

## Entrega

- `importGscQueriesCsv` recusa consultas exatamente repetidas na mesma exportação, antes de retornar o relatório; erro genérico `GSC CSV: duplicate query row N`, sem o termo bruto.
- `analyzeQueryExport` aplica a mesma fronteira aos relatórios JSON ou objetos fornecidos diretamente, **antes** da filtragem de consultas pessoais. A verificação fica ativa em `compareGscPeriods` para cada uma das duas janelas.
- A identificação é por **string exata**, sem colapsar maiúsculas, acentos ou consultas diferentes no mesmo grupo temático. As somas válidas continuam funcionando.
- Os valores de consulta existem apenas na memória da execução privada, não são escritos no resultado, logados, persistidos ou enviados para qualquer rede.
- Testes sintéticos cobrem duplicidade em CSV, duplicidade com e-mail fictício, JSON e comparações de períodos, além de linhas distintas no mesmo cluster e diferenças de maiúsculas.

## Limites

Não garante que dados fornecidos são do Google ou completos: exportações de Search Console podem omitir consultas anonimizadas ou ter truncamento. O novo bloqueio apenas impede duplicidade exata dentro da amostra fornecida. Não ativa OAuth, publicação, cliente, rede, grants, migração de banco, cobranças ou deploy.

**NO-GO de produção:** revisão independente AppSec/SEO, CI Node 22/24 e eventual homologação do consumidor Imagine Comercial antes de promover o código.
