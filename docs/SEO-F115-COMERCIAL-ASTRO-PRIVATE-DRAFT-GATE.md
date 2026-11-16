# SEO F115 — prova de vazamento no build Astro real (CI descartável)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F114 #162](https://github.com/rafhael100/imagine-seo-engine/pull/162).

## Por que esta etapa existe

A F113 protege as prévias privadas F112 com um marcador que o auditor F0 consegue identificar. A F114 cruza o inventário municipal com HTML compilado. A F115 comprova que a proteção F113 também funciona no **HTML realmente compilado** de uma versão imutável do site Imagine Comercial (Astro), não apenas em HTML gerado pelos testes unitários.

## Teste com código real do Comercial

O workflow `.github/workflows/seo-f115-astro-private-preview-leak.yml`:

1. Faz checkout do SEO Engine sob revisão e do commit Comercial Astro **fixo** `f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a` (checkout sem persistir credenciais).
2. Compila o Comercial com seu lockfile no contêiner descartável GitHub Actions e executa `check:dist`.
3. Audita as 45 páginas esperadas no build com strict public head, canonical, robots, sitemap e hreflang PT/EN/ES: exige **0 erros e 0 avisos**.
4. Insere temporariamente no `en/index.html` gerado a marca `imagine:editorial-preview`, **sem alterar robots=index**. Exige erro `private_editorial_preview_in_public_build`.
5. Restaura a página original. Em nova mutação, inclui o aviso de prévia antiga sem marcador, exigindo a mesma recusa.
6. Restaura em `finally`, reexecuta a auditoria completa e exige build totalmente limpo, mantendo fontes versionadas intactas.

O script **recusa** execução fora de GitHub Actions e caminhos que não apontem exatamente para a pasta descartável `.qa/comercial-i18n/dist`.

## Limites e pendências

O GitHub Actions compila uma versão **pinned** do Comercial, e isso não é prova de que a VPS, DNS, Cloudflare e site em produção estão iguais. A prova não faz merge nem deploy, e não inclui credenciais reais, conteúdo privado de clientes nem acesso à Google.

A aprovação desta etapa não substitui testes operacionais de distribuição, backups, rollback, auditoria AppSec/LGPD, controle editorial e publicação aprovada. 

Executar a suíte geral: `npm test`. O workflow deve completar com sucesso na SHA exata da PR.
