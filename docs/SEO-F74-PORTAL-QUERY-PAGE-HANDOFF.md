# SEO-F74 — Handoff de revisão query/page para o futuro Imagine Portal

`prepareOfflinePortalQueryPageReview({sourceRevision,plan,pages})` recompõe o relatório a partir do blueprint F71 e das respostas originais validadas pela F72. Não confia em agregados fornecidos pelo operador, não faz OAuth/HTTP e não contém consultas, URLs de páginas, candidatos a redirect ou tokens no resultado.

O envelope `seo-portal-query-page-review-offline-v1` só traz contagens, datas, identificadores sintáticos de escopo, revisão pinada por SHA de 40 caracteres e o código fixo `review_query_page_overlap`. Este sinal só é emitido quando existem sobreposições observadas **sem** linhas ocultadas e sem paginação potencialmente incompleta. Em qualquer outro cenário usa `REDACTED_ROWS_NO_SIGNALS` ou `PARTIAL_BATCH_NO_SIGNALS`.

**Não é uma recomendação de mudar a canonical ou redirecionar páginas.** A sobreposição exige avaliação humana contextual. Nem SHA, nem tenantRef, nem fingerprint são comprovação de origem ou autorização, que devem vir de sessão autenticada e verificação da propriedade Google no backend.

Saída sempre com `customerDisplayAuthorized=false`, `oauthVerified=false`, `backendTenantGrantVerified=false` e `publicationAuthorized=false`. A eventual integração exige revisão independente AppSec/LGPD, MFA/RBAC, armazenamento seguro de tokens, grants por empresa e CI de integração. Sem dados reais em Git, deploy ou merge em `main`.
