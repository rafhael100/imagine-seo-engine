# Imagine SEO RC77 — robots/sitemap efetivos no Nginx real com HTML Comercial F348

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base comprovada e preservada

A [RC76 #301](https://github.com/rafhael100/imagine-seo-engine/pull/301), SHA `fc715fcfab8512b56e82cb482ba9fdc210b9a4d5`, concluiu **67/67 workflows SUCCESS**. Sua cadeia cumulativa incorpora IBGE territorial oficial 2025 com bloqueios de conteúdo municipal, migração de URLs GSC e 301 privados, Comercial F336–F348 com Chromium e QA PT/EN/ES, Nginx Docker real F197 e modo sem porta publicada F198. Mantém F199/F200 protegendo a custódia de GSC/HTTP/inventário Docker antes de qualquer acesso à rede.

## Entrega integrada F201

A [F201 #302](https://github.com/rafhael100/imagine-seo-engine/pull/302), SHA `860e00b85f0857b76d0acc45f51611611d54733c`, concluiu **3/3 workflows SUCCESS**:
- Verifica por HTTP **GET realmente emitido pelo Nginx Docker F197** que `robots.txt` e `sitemap.xml` respondem status 200, MIME adequado, sem compressão nem redirecionamento inesperado.
- Compara **byte por byte** o corpo dessas duas respostas com os arquivos do mesmo Astro Comercial **F348 SHA `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`** compilado na CI, complementando os três GET HTML e dois HEAD 301 já validados anteriormente.
- Os testes adversariais locais em Node 22/24 rejeitam sitemap obsoleto, redirect de robots, arquivo ausente, symlink e ambiente não autorizado. As entradas são validadas antes de qualquer GET; nenhum URL, conteúdo, rede Docker ou dado privado é retornado nos relatórios.
- Mantém `publicRobotsIndexingAuthorized=false`, `deploymentAuthorized=false`, `publicationAuthorized=false`, `realGscTenantVerified=false` e status de release **HOLD**.

## Check de release desta HEAD

Reexecutar CI **integral na HEAD própria da RC77**, não apenas na PR de origem F201: build e Chromium Comercial F348, Docker real F197/F198 e F149/F150/F151/F152, GSC e redirects F183–F187, F193/F199 privacidade de exportações e receipts, F148/F200 inventário Docker seguro, F188 cadeia de suprimentos, F189/F194/F196 permissões, IBGE oficial e política editorial. Exigir todos os workflows concluídos em SUCCESS e nenhuma alteração em `main`.

## Pendências para uso externo e publicação

1. **Google GSC real**: sessão MFA, OAuth readonly `webmasters.readonly`, consentimento por tenant, `sites.list` exato autenticado, cofre de tokens e revogação auditável no Portal/SEO Engine. A ligação OpenSEO não transfere tokens, e os atuais contratos Portal ainda são de laboratório.
2. **Homologação Leaseweb**: isolamento de serviços, inventário autenticado, TLS e firewall, 301/canonical/hreflang reais, resposta `robots/sitemap` na URL pública pretendida, backup, restauração e rollback verificado; nenhum desses testes foi realizado na VPS pela RC77.
3. **Revisão independente** AppSec/DBA/LGPD, autoria/conteúdo editorial relevante, disponibilidade comercial local e direitos de publicação antes de qualquer expansão municipal.
4. **Decisão humana GO** separada para merge, deploy, DNS, indexação e cobranças.

O que a RC77 comprova é apenas a engenharia e o comportamento do Nginx em runner descartável, com GSC sintético. **Não há publicação, mudança de DNS, merge ou despesa nova.**
