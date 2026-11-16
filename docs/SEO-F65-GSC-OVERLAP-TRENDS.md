# SEO-F65 — Comparação histórica de consultas associadas a várias páginas

O `compareOfflineGscQueryPageOverlapPeriods` recebe dois **conjuntos originais** de respostas Search Analytics `query,page`, não agregações calculadas pelo chamador. Revalida cada resposta com F57/F64, exige a mesma empresa, fingerprint da propriedade e janelas de mesma duração, cronológicas e sem sobreposição. O resultado compara a fração das consultas presentes em duas ou mais páginas, sem retornar nenhuma consulta, URL, hash reversível ou parâmetro privado.

O indicador `review_overlap_share_increase` exige pelo menos dez consultas distintas em cada período, pelo menos quatro consultas sobrepostas no período atual e aumento absoluto de quinze pontos percentuais na fração observada. **Não comprova canibalização nem é recomendação automática de redirecionamento.** A presença de paginação potencial (última página cheia) suprime os sinais, pois não existe garantia de cobertura integral do Google.

Os testes utilizam datas, domínios e dados fictícios. Não há acesso ao Google, OAuth próprio do Portal, exibição de clientes, DNS, regras de redirect, deploy ou merge `main`. Revisão independente AppSec/DBA/LGPD e homologação autenticada continuam requisitos para publicação.
