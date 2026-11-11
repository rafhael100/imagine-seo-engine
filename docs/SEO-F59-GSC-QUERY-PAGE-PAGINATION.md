# SEO-F59 — Paginação robusta de consultas associadas a páginas

O agregador `reviewOfflineGscQueryPagePagination` recebe 1–4 respostas de uma consulta Google Search Analytics **fornecidas ao programa**, com `startRow` coerente, até 1.000 linhas por página, offsets contíguos e páginas intermediárias completas. Revalida ordenação por cliques e duplicações *em todas as páginas*, não somando superficialmente indicadores isolados: uma consulta presente em páginas de resultados distintas é contabilizada corretamente.

O motor F57 pode processar no máximo 4.000 linhas na composição F59, enquanto cada página individual permanece limitada a 1.000. O retorno contém número de páginas e linhas, próximo offset somente quando a última página está cheia, indicação de truncamento potencial e métricas agregadas. Não retorna palavras-chave brutas, URLs, termos pessoais ou hashes reversíveis. Uma página final não cheia **não comprova** que o Google informou todo o tráfego do domínio.

**HOLD:** leitura exclusivamente offline com dados sintéticos na CI; sem OAuth próprio, token, rede, dados reais em Git, callbacks públicos, redirects, publicação, DNS ou deploy. Revisão independente SEG/DBA/LGPD e homologação IAM/MFA no Portal permanecem necessárias.
