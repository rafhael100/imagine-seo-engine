# SEO-F63 — Contrato GSC de paginação v2

A saída `seo-gsc-query-page-pagination-offline-v2` substitui a v1 para novas análises F59, preservando todas as restrições, agregações e sinalizadores de segurança. O envelope `pagination` inclui adicionalmente `pageSize` (1–1.000) e `lastPageRows` (0–pageSize), permitindo ao consumidor validar matematicamente `rowsReceived = (pagesReceived - 1)*pageSize + lastPageRows` e `mayHaveMore = (lastPageRows === pageSize)`.

Os testes do próprio motor cobrem lotes finais completos/incompletos e até quatro páginas, sem enviar consultas, URLs, hashes de termos ou dados reais à saída. Consumidores estritos de v1 devem permanecer fixados na RC26 até serem atualizados explicitamente para v2; não fazer rollout silencioso. O Portal adotará v2 em branch de revisão separada.

**HOLD:** sem OAuth próprio do Portal, credenciais, rede Google, publicação, 301, DNS, merge main ou deploy. Revisão independente, IAM de tenant e homologação autenticada continuam necessários.
