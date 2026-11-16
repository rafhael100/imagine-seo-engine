# Imagine SEO RC53 — laboratório Nginx real com build e redirecionamentos

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida a RC52 [#208](https://github.com/rafhael100/imagine-seo-engine/pull/208), F142 [#209](https://github.com/rafhael100/imagine-seo-engine/pull/209), F143 [#210](https://github.com/rafhael100/imagine-seo-engine/pull/210) e F144 [#211](https://github.com/rafhael100/imagine-seo-engine/pull/211). Nenhum serviço real da Imagine foi alterado.

## Implementações comprovadas

- F142: verifica bytes **GET** reais (Host canônico, `127.0.0.1`, conexão sem redirect externo) comparados com HTML compilado, detectando conteúdo divergente de igual comprimento mesmo se o proxy disser SHA correto.
- F143: integra a comparação de GET ao gate GSC/301/build F141. Preflight falho impede GET; divergência mantém HOLD; arquivos de recibo continuam privados e nunca são anexados à PR.
- F144: exercita a versão integrada **em Nginx real**, em contêiner Docker Compose com usuário não privilegiado, capacidades removidas, raiz somente leitura, mounts somente leitura e SHA imutável de imagem. Porta host aleatória restrita a `127.0.0.1`, projeto/rede Docker exclusivos do runner.
- F144 CI testou cenário bom (conteúdo PT/EN + redirects HTTP/www/en-us) e adversarial (header SHA correto, Nginx serve PT na rota EN): **o caso adversarial foi bloqueado**.
- O F77 continua impedindo acesso de rede em `src/` e `scripts/`; os experimentos de HTTP são isolados em `labs/` com opt-in. A configuração de staging não é implementada no servidor remoto.

## Evidências verificadas

- F142 [#209](https://github.com/rafhael100/imagine-seo-engine/pull/209): teste completo Node 22/24 e suite geral, SUCCESS na HEAD `f5c81b7d8a915739d0922b5405ccd46befcc2c39`.
- F143 [#210](https://github.com/rafhael100/imagine-seo-engine/pull/210): teste completo Node 22/24 e suite geral, SUCCESS na HEAD `26b8a004449f1849a90820ed5d42f317465857c2`.
- F144 [#211](https://github.com/rafhael100/imagine-seo-engine/pull/211): Nginx oficial Docker Compose real + testes completos Node 22/24, SUCCESS na HEAD `7eb2e36beca15873035d0c70a472258db08cddf6`.
- A RC53 exige CI inteira novamente na **sua própria HEAD**, inventário de alterações paginado e revisão independente. O histórico acumulado de branches permanece amplo.

## Limitações de infraestrutura

O Compose F144 é **fixture descartável de CI**, não template aprovado de produção. Apesar de a rede ser independente, o bridge pode oferecer egress e requer controles específicos para a VPS. A imagem Nginx fixada por digest deve ser atualizada, ter CVEs verificadas e ser submetida à revisão de segurança antes de deployment. O teste não autoriza acesso à VPS nem instalação de serviços.

O conteúdo e a propriedade GSC dos testes são sintéticos (`example.test`); não houve OAuth por empresa, emissão de redirects Cloudflare/Nginx de clientes ou publicação de páginas reais.

## Critérios reais para encerramento da prioridade SEO

1. Conteúdo editorial original e traduzido, inventário de URLs/municípios oficial IBGE e validação de canonical/hreflang/sitemap sem doorway.
2. Fonte GSC real autorizada e tenant identificado no Portal, consentimento e retenção LGPD.
3. Staging Leaseweb exclusivo e comprovado sem conflitos (CRM/Portal/Sites/Performance), Docker/portas/volumes/redes, TLS/SNI, backup/restauração e ensaio de rollback.
4. PRs acumuladas auditadas (incluindo migrations/workflows/rotas/supply chain), revisão externa AppSec/SEO/DBA e autorização humana de merge/publicação.
5. Avaliação de redirects HTTP **públicos** e comportamento Cloudflare separadamente do laboratório local.

**Status: HOLD.** O resultado técnico da CI é positivo, mas não substitui validação funcional e segurança da implantação real.
