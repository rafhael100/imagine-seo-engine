# SEO-F54 — Comparação de desempenho orgânico por dia (offline)

O novo `compareOfflineGscDailyPeriods` recebe dois relatórios Search Analytics do tipo `date`, revalidando ambos pelo contrato F52 antes de comparar. Exige a mesma empresa e fingerprint da propriedade, janelas sem sobreposição e iguais em duração, e formatos fechados para impedir autorizações forjadas.

A análise informa cliques, impressões, CTR e posição ponderada de cada período, além das diferenças. Sinais para revisão de queda só aparecem se **todos os dias de ambas as janelas estiverem presentes e nenhuma possível paginação** restar. Mesmo com cobertura completa das datas fornecidas, o provedor pode omitir consultas anônimas e outras linhas; a saída não atesta tráfego total nem causalidade. Nenhuma notificação automática ou alteração de SEO é realizada.

Toda execução é offline com dados fornecidos ao programa. Permissões de cliente/Google/Portal, OAuth, rede e produção permanecem falsas. Testes são sintéticos, sem inserir dados da conta Imagine em GitHub ou CI, sem custos, deploy, DNS ou merge na `main`.
