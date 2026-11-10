# Imagine SEO Engine

Motor de auditoria técnica e análise SEO **offline**, sem conexão com contas de clientes nem publicação automática.

## Estado técnico em 09/11/2026
- Etapas SEO-F0…F14 implementadas em PRs de desenvolvimento, com 78 testes Node aprovados na ponta F14: https://github.com/rafhael100/imagine-seo-engine/pull/17
- Esta branch adiciona testes de ponta a ponta para os CLIs (SEO-F15).
- `main` permanece sem merge. O código **não é uma operação SaaS habilitada**; todas as fontes GSC são exportações manuais ou respostas fornecidas offline.
- Imagine Comercial permanece prioridade P0, SEO Engine P1.

## Funções locais
- Auditor: `node scripts/audit-dist.mjs dist https://example.com/ --fail-on-warnings`
- Comparação de builds: `node scripts/compare-audit-offline.mjs antes.json depois.json`
- Análise de consultas CSV: `node scripts/report-gsc-csv-offline.mjs consultas.csv 2026-10-01 2026-10-07`
- Tendência entre períodos: `node scripts/compare-gsc-csv-offline.mjs antes.csv 2026-10-01 2026-10-07 depois.csv 2026-10-08 2026-10-14`

## Testes
- `npm test` roda testes unitários e os cenários de ponta a ponta com dados fictícios.
- `npm run test:smoke` roda apenas os CLIs sintéticos.
- Node.js 22 ou superior, sem dependências externas ou instalação de fornecedores.

## Limites antes de produção
1. Confirmar acesso autorizado à propriedade Search Console real, consentimento e credenciais OAuth somente leitura.
2. Implementar autenticação/segregação multiempresa no Portal, RBAC, criptografia de tokens, retenção e LGPD.
3. Fazer homologação na VPS quando disponível; conferir configuração, monitoramento, backups, migrações e rollback.
4. Validar integração de CI e atualização segura do SHA pinado no Imagine Comercial.
5. Revisar e aprovar integração/merge em `main`; **não publicar páginas, trocar DNS ou ativar cobrança automaticamente**.

Checklist rastreável: https://github.com/rafhael100/imagine-seo-engine/issues/14

Dados artificiais de testes não demonstram tráfego, ranking, indexação ou conformidade de produção.

## Relatório executivo local SEO-F17

`node scripts/report-seo-brief-offline.mjs auditoria.json [comparacao-gsc.json]` produz categorias fixas de revisão e totais agregados para futura interface do Portal. O comando não publica relatórios nem consulta o Google, e não imprime termos, caminhos de arquivos ou mensagens livres do input.

## Revisão de migração de URLs (SEO-F22)

`node scripts/review-route-migration-offline.mjs before.json after.json candidates.json` verifica candidatos 301 informados manualmente, mas **nunca** gera regras ou autoriza publicação. Qualquer URL removida mantém o gate de revisão humana e status de saída 1. Variantes com query, percent-encoding ou destino externo são rejeitadas.

## Envelope de revisão para Portal (SEO-F24)

`node scripts/prepare-portal-handoff-offline.mjs brief.json tenantRef propertySha256 sourceCommitSha` gera contrato de revisão sanitizado. O campo `customerDisplayAuthorized` é sempre `false`; cabe ao Portal real autenticar, autorizar e comprovar propriedade/consentimento. Não há rota API, dashboard SaaS, credencial ou publicação implementada por este comando.

## Política reforçada para páginas públicas (SEO-F25)

Adicione `--strict-public-head` ao auditor para exigir `meta robots=index,follow` e `og:url` correspondente à URL canônica, além das verificações padrão. Recomendado somente para builds de páginas públicas curadas; continua desativado por padrão para manter compatibilidade com outros builds estáticos.
