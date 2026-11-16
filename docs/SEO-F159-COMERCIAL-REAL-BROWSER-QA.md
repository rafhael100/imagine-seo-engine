# SEO F159 — navegador Chromium real, versão Comercial imutável

**Status: DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Parte da [issue #236](https://github.com/rafhael100/imagine-seo-engine/issues/236), sobre a candidata [RC60 #235](https://github.com/rafhael100/imagine-seo-engine/pull/235).

## Por que existe
A F158 constrói HTML Astro real e audita a estrutura da versão Comercial F336 (sobre F335). A F159 adiciona outra camada de integração: executa os **testes de navegador nativos do próprio Comercial** sobre o build compilado, usando Chromium de CI. Assim, não se substitui um teste de interação real por leitura estática ou por cenários inventados.

## Contrato

- Checkout da candidata Comercial na SHA exata `0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38`, sem refs móveis nem token persistente.
- Dependências do Comercial pelo lockfile (`npm ci`), Chromium instalado usando o Playwright **já declarado** pelo Comercial; nenhuma dependência Playwright adicionada ao SEO.
- Executa testes nativos, `astro build`, `check:dist`, auditor F158 no HTML real e `test:browser` do Comercial, que exercita os cenários do funil PT/EN/ES, cálculos, cópia voluntária, invalidação de estimativas e navegação.
- Testes usam servidor de preview `127.0.0.1` em runner descartável. Não conectam GSC/GA4, CRM, pagamentos, VPS nem serviços do cliente por conta desta integração.
- Sem postagem de capturas de tela, URLs privadas ou dados de usuário em artefatos deliberados deste workflow. O próprio teste nativo pode registrar evidência local no runner efêmero.
- `permissions: contents: read`; nenhum merge, DNS, deploy ou publicação.

## Critérios de revisão
1. Inspecionar o workflow e a SHA Comercial; confirmar que o script `test:browser` e seus efeitos são conhecidos.
2. Confirmar resultado completo de CI na **SHA da própria PR F159**, sem promover automaticamente status `success` a liberação.
3. Revisar lacunas de regressão no Comercial antes de propor testes adicionais, evitando reimplementar suites já existentes.
4. Revisar política de saídas de rede e dependências do ambiente de CI. O download do browser é do ambiente Playwright, **não representa acesso oficial ao IBGE**.
5. Bloquear release até a cadeia AppSec/SEO, fonte IBGE/DTB autêntica, conteúdo editorial, GSC por tenant, staging Leaseweb, rollback e aceite humano.

## Limitações
Os testes de navegador simulam a experiência do site candidato em localhost, não provam operação em endereço público. Os dados municipais F110 e a origem do workbook DTB ainda não foram autenticados. Nenhuma evidência real de Google Search Console é criada por este workflow.
