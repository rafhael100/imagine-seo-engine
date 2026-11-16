# SEO-F73 — CLI privada de validação de plano GSC query/page

`node scripts/review-gsc-planned-query-page-offline.mjs <private-plan-and-pages.json>`

Recebe um arquivo local JSON com duas chaves `plan` (F71) e `pages` (respostas sintéticas ou exportadas por operador autorizado), revalida o contrato com F72 e imprime exclusivamente relatório agregado. Leitura limitada a 10 MiB e recusa de symlinks finais, arquivos irregulares, JSON inválido e flags extras. Erros só produzem mensagens sanitizadas; nenhum termo, URL de página, token ou caminho privado é apresentado.

**Não conectar a Google nem a Portal real.** `tenantRef` e `propertyFingerprint` ainda são dados declarados; a ferramenta não autentica usuário ou autorização do tenant. `customerDisplayAuthorized`, `oauthVerified`, `tenantGrantVerified` e `productionReadAuthorized` permanecem falsos. Os dados reais não devem ser adicionados ao GitHub nem ao CI.

Gate de implantação: revisão independente AppSec/LGPD, fluxo OAuth com grants vinculados ao usuário/empresa, consentimento auditável, segredo criptografado e isolamento multiempresa no backend, testes de integração autenticada e promoção controlada de SHA. Sem deploy, compra de serviços, publicação SEO ou merge em main nesta entrega.
