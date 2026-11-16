# Imagine SEO RC33 — Consolidação offline F0–F80

Base de release: `release/seo-offline-rc32-2026-11-11` (SHA `f46b65aaef9b10e32d02e415907cd916a43b548e`). A RC33 inclui as funcionalidades acumuladas até F80 e **não** é uma liberação operacional de Google Search Console.

## Alterações sobre a RC32

- **SEO-F79**, [PR #114](https://github.com/rafhael100/imagine-seo-engine/pull/114): `prepareOfflinePortalQueryPageDisplayModel` recalcula dados originais do lote F74 e oculta indicadores de consultas quando a amostra é parcial ou teve linhas pessoais omitidas. Nunca aceita um relatório agregado forjado. Contratos `oauthVerified`, `backendTenantGrantVerified`, `customerDisplayAuthorized`, `publicationAuthorized` e `networkPerformed` permanecem `false`.
- **SEO-F80**, [PR #115](https://github.com/rafhael100/imagine-seo-engine/pull/115): CLI local protegido por leitura limitada a 10 MiB, UTF-8 estrito, arquivo regular sem link simbólico final, JSON seguro e diagnósticos sem vazamento. Testes de entradas adversariais.
- **Integração de laboratório Portal**, [PR #408](https://github.com/rafhael100/imagine-portal/pull/408): CI compara privacidade de F74/RC32 versus F79 e HTML PHP F159 em cinco cenários; a branch de integração permanece **DRAFT/NO-GO**.

## Gates antes de integrar

1. Matriz CI Node 22 e Node 24 da RC33, incluindo todos os testes sintéticos acumulados.
2. Revisão independente AppSec/DBA/LGPD do código e dos testes, especialmente origem de tenant e propriedade e possíveis erros de truncamento.
3. Backend autenticado de Portal com sessão/MFA, grants por empresa, propriedade real consentida, OAuth seguro, log redacted, quotas, retenção e ambiente staging isolado.
4. Confirmação de SHA e lote de integração, revisão de rollback e autorização específica antes de qualquer merge/implantação.

**Não há** HTTP para Google, token, dados de clientes no Git, OAuth operacional, SaaS pago em produção, 301, publicação, alteração de DNS, banco real, faturamento ou deploy. O estado final continua `HOLD_EXTERNAL_AUTHORIZATION`. Branches `main` e produção inalteradas.

Não atribuir percentuais de conclusão do produto apenas pelo número F80: os módulos são laboratoriais e a integração real ainda possui gates explícitos.
