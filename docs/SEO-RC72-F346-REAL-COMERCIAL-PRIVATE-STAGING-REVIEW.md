# Imagine SEO RC72 — Comercial F346, HTTP HEAD real em laboratório e segurança do staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Histórico preservado

A [RC71 #283](https://github.com/rafhael100/imagine-seo-engine/pull/283) foi aprovada nos **62/62 workflows de sua própria HEAD** `f77d2f231c55e9f60c3fb7bc0817a3f000a8a932`. Ela inclui:
- GSC PAGE e proposta privada de 301 F183/F185, sem divulgar URLs;
- verificação combinada F186 e respostas HEAD reais em loopback F187, sem tráfego público;
- auditoria de arquivos originais, removidos e renomeados F188;
- correção F189 que impede expor mapas Nginx 0644 em pasta host 0755;
- referência IBGE oficial 2025 e revisão de conteúdo municipal/serviços;
- testes Astro e Chromium do Comercial.

A RC72 acrescenta:
- [F190 #285](https://github.com/rafhael100/imagine-seo-engine/pull/285), **2/2 workflows SUCCESS**: compara dois builds reais Comercial F336→F344, inventário de rotas e regressões SEO, e executa a suíte nativa Chromium F344 em PT/EN/ES.
- [F191 #286](https://github.com/rafhael100/imagine-seo-engine/pull/286), **2/2 workflows SUCCESS**: integra a revisão paralela [#284](https://github.com/rafhael100/imagine-seo-engine/pull/284) do Comercial F346, preservando todos os testes de HTTP HEAD reais F187 e o F186 sobre um único build F346. O checkout é fixado na SHA **`9c4b29c168ef0d53abfbf44e64c404fbcc8dc01a`**.
- Na SHA acima do repositório `rafhael100/imagine-comercial`, **6/6 execuções de CI SUCCESS**, incluindo o workflow nativo de SEO/build/navegador e os laboratórios descartáveis de contratos comerciais e PostgreSQL. Essa aprovação é apenas da revisão específica, não um passe de deploy.

## Gate de CI da própria RC72

Reexecutar **todos os workflows** da HEAD exata RC72 e verificar:
1. Astro e Chromium F344, além do verificador F346 PT/EN/ES com funil anônimo, resumo comercial e CTA local `#simular-compra`.
2. Cadeia original F185/F186/F187, incluindo requisições HEAD reais em `127.0.0.1`, 301 esperado e adversariais 302/Location externo/segundo hop/404.
3. Captura original IBGE DTB/Áreas 2025, editoriais municipais e catálogo Comercial inicial Onepage/Landing Page; não publicar automaticamente páginas municipais.
4. Inventário cumulativo Git F188, que **inclui exclusões e os dois lados de renomeações**; revisão de riscos por pessoa independente.
5. Permissões do mapa privado Nginx F189, Docker real de laboratório e testes de staging isolado F149–F152, sem inferir que a Leaseweb foi homologada.

## Bloqueios de produção

- Integrar Google Search Console ao **backend do Imagine SEO Engine por tenant/propriedade**, com OAuth `webmasters.readonly`, consentimento, MFA/RBAC, tokens secretos, segregação, revogação, expiração e auditoria. O acesso OpenSEO é de um serviço diferente e não é transferido.
- Homologar HTTPS/TLS e redirects 301 reais HTTP/www/`en-us` em staging Leaseweb autorizado, incluindo equivalência editorial, canonical/hreflang, inventário de portas e recursos, firewall, backup/restauração, teste de rollback e aceite.
- Revisão independente AppSec/DBA/LGPD do diff cumulativo, autenticação/assinaturas, Docker, Nginx, CI e privacidade.
- Comprovar demanda, originalidade e prestação do serviço por município, independentemente do cadastro territorial oficial.
- GO humano específico para merge, deploy, DNS, indexação e qualquer custo, com evidências versionadas.

**Todos os resultados de laboratório mantêm `publicationAuthorized=false` e `redirectDeploymentAuthorized=false`. Esta RC72 não altera `main`, VPS, DNS, Google, pagamentos ou tráfego de clientes.**
