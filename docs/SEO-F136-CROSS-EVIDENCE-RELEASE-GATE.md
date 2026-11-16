# SEO F136 — gate de pré-publicação baseado em três provas independentes

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação F133 [#193](https://github.com/rafhael100/imagine-seo-engine/pull/193), F134 [#195](https://github.com/rafhael100/imagine-seo-engine/pull/195) e F135 [#196](https://github.com/rafhael100/imagine-seo-engine/pull/196).

## Contrato integrado

`reviewOfflineMigrationCrossEvidence({gscPageInput,migrationInput,httpCapture,buildDirectory})` executa três verificações SEM AUTORIZAR redes ou publicação:

1. **GSC × plano** — F133 detecta URLs legadas observadas que não possuem destino 301 planejado; não confunde observação histórica com situação real.
2. **HTTP × plano** — F134 verifica cada comprovante fornecido, exigindo 301, um salto, Location/destino final correto e 200. Não certifica a origem da captura.
3. **Build × plano** — F128 revisita arquivos HTML **reais em disco**, canonical, sitemap/robots, idioma e destinos públicos esperados.

O módulo valida os insumos antes da operação assíncrona, tira um snapshot dos campos do plano e devolve somente contagens e códigos fixos dos componentes bloqueados. Não imprime domínio, página, query, key, URL ou corpo de resposta.

Se **qualquer** prova apresentar falha ou ausência, `reviewStatus='blocked'`. Se todas as provas locais forem coerentes, retorna `human_independent_release_review_required` — não `deployAllowed`.

## O que os testes comprovam

Exercitam HTML temporário real PT/EN, entradas por página do GSC totalmente sintéticas, recibos 301 simulados, falta de captura, URL histórica esquecida, página HTML ausente, query com dados privados e inserção maliciosa de campos de autorização. Node 22/24 e suíte completa; nenhuma rede.

## Gates reais ainda ausentes

- OAuth GSC/GA4 e escopo por tenant auditados no Portal, revogação e consentimento.
- Capturas HTTP de staging com identidade, certificado TLS e rota da VPS comprovados.
- Conteúdo editorial correspondente, canonical/hreflang completo e páginas úteis, sem doorway.
- Revisão independente AppSec/DBA/LGPD, backups, restauração e rollback.
- Aprovação humana do commit e do deploy. Nunca ativar redirect no site público apenas porque este gate retornou revisão humana.
