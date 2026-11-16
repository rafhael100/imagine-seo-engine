# SEO-F61 — Arrays estritos na fronteira GSC offline

O revisor de consultas/páginas F57 e seu agregador de paginação F59 aceitam somente **arrays nativos densos** de dados próprios. Agora recusam posições inexistentes, propriedades ocultas ou simbólicas, iteradores redefinidos, protótipos de terceiros e getters que poderiam executar código durante a iteração de entradas não confiáveis.

O limite de processamento permanece **quatro páginas de 1.000 linhas**, com as verificações anteriores de duplicidade, consistência e privacidade. A mudança não amplia operações de rede, permissões ou a exposição de consultas/URLs. Os testes adversariais verificam explicitamente que getters não são executados.

Essa restrição é compatível com arrays produzidos por `JSON.parse` e não é defesa genérica contra armadilhas de objetos Proxy. O backend deverá usar serialização/parse seguro e ambiente isolado. CI usa somente dados sintéticos. **HOLD** até identidade/grants do Portal, OAuth próprio, revisão independente, homologação e aprovação de produção. Sem dados reais, custos novos, deploy, DNS ou merge na main.
