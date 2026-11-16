# Imagine SEO RC46 — revisão consolidada, F122–F126 (15/11/2026)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolidação de F122 [#178](https://github.com/rafhael100/imagine-seo-engine/pull/178), F123 [#179](https://github.com/rafhael100/imagine-seo-engine/pull/179), F124 [#180](https://github.com/rafhael100/imagine-seo-engine/pull/180), F125 [#181](https://github.com/rafhael100/imagine-seo-engine/pull/181) e F126 [#182](https://github.com/rafhael100/imagine-seo-engine/pull/182), apoiadas na RC45 [#176](https://github.com/rafhael100/imagine-seo-engine/pull/176).

## Evidências verificadas na branch de origem

SHA funcional Engine F126: `38b80fe77bd74ea6e19b8751014038ac3b9f8400`.

- F122: revisão de cobertura PT-BR/EN-US/ES-ES por município e serviço; 5.600 grupos de dados sintéticos exercitados; Node 22/24 aprovados.
- F123: auditoria integrada do inventário e HTML estático compilado; Node 22/24 aprovados.
- F124: nove relações hreflang obrigatórias por grupo trilíngue, inclusive autorreferências; auditoria Astro e regressões aprovadas na HEAD de origem.
- F125: CLI somente leitura para validar build local; código de saída 0 para **revisão humana**, 2 para bloqueado e 1 para inválido.
- F126: relatório compacto do resultado integral, assinado Ed25519 v2 em CI, sem publicar. [CI F126](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43788200696) e [validação geral](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43788200558): **SUCCESS**.
- Portal F138 [#893](https://github.com/rafhael100/imagine-portal/pull/893), F139 [#894](https://github.com/rafhael100/imagine-portal/pull/894) e F140 [#895](https://github.com/rafhael100/imagine-portal/pull/895) consomem a **SHA funcional F126** em CI, sem pressupor disponibilidade pública.

## Inventário do diff — alerta material

Na comparação da SHA funcional com `main`, o GitHub reportou **465 commits à frente**, zero atrás e **apenas 300 arquivos retornados** pelo compare (possível truncamento do resultado). **NÃO** afirmar que os 300 representam a lista completa nem realizar merge só por checks verdes. É necessário auditar os nomes de todos os arquivos da PR paginada, revisar alterações históricas e separar escopo técnico de mudanças editoriais e de infraestrutura.

## Gates para decisão

1. Confirmar a HEAD exata da RC46 e rerodar os workflows; inspecionar todos os checks e eventuais falhas, sem se basear em SHA antiga.
2. Inventário completo, revisão independente de segurança, dependências, scripts, CI, dados e mudanças territoriais; reconciliar PRs alternativas RC43/RC44/RC45, sem mesclar caminhos concorrentes.
3. Fonte IBGE real autenticada, tipologia municipal/DF/Noronha aprovada, conteúdo editorial original e relevante por região, traduções humanas e anti-doorway.
4. Portal com autenticação e vínculo de serviço reais, GSC OAuth somente leitura autorizado, custódia confiável de chaves Ed25519, revogação, RLS, retenção LGPD, backups.
5. Staging Leaseweb isolado, DNS/TLS, saúde do serviço, auditoria de build real, restauração e rollback ensaiados, autorização humana formal.

**Estado de release: HOLD.** As PRs de laboratório não alteram `main`, DNS, VPS, contratos, cobrança nem clientes reais.
