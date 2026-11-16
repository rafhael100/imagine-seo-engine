# SEO-F71 — Blueprint interno para consulta query,page do GSC

`planOfflineGscQueryPage` reutiliza o validador F10 para gerar uma descrição *somente leitura* para o futuro backend autenticado do Portal. O caminho da propriedade é codificado como parte do endpoint oficial e o escopo planejado é `webmasters.readonly`.

Limites: `dimensions=['query','page']`, `aggregationType='byPage'`, `type='web'`, `dataState='final'`, `rowLimit` de 1 a 1.000 e `startRow` alinhado ao tamanho da página para 0, 1, 2 ou 3 páginas anteriores. Nenhuma consulta HTTP é realizada; não recebe nem grava token, chave OAuth ou refresh token.

O parâmetro de declaração local `authorizationConfirmed=true` é exigido **apenas para compor um plano** e não autentica pessoa, empresa ou propriedade. Todas as permissões de exibição, OAuth, acesso à propriedade e leitura em produção são retornadas como `false`.

Para ativar no Portal: autenticação MFA, RBAC por empresa, consentimento, verificação da propriedade no backend Google, criptografia de tokens, armazenamento segregado, rate limit, retenção/revogação e revisão independente de LGPD/AppSec. Até lá, o contrato permanece `HOLD_AUTHENTICATED_PORTAL_INTEGRATION`.

Testes usam exemplos fictícios, sem rede, gastos, deploy, liberação de cliente ou merge na `main`.
