# Imagine SEO RC67 — municípios DTB oficiais × catálogo de produtos Imagine

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Cadeia preservada

- [RC65 #266](https://github.com/rafhael100/imagine-seo-engine/pull/266): 56/56 workflows aprovados, dois produtos oficiais IBGE 2025 conciliados com tratamento explícito de Lagoa Mirim e Lagoa dos Patos como **áreas operacionais**, nunca novos municípios.
- [RC66 #268](https://github.com/rafhael100/imagine-seo-engine/pull/268): 57/57 workflows aprovados, F179 vincula o filtro de qualidade F107 à referência municipal DTB oficial com SHA da F172, nome/UF e exceções de Brasília/Fernando de Noronha.
- [F180 #269](https://github.com/rafhael100/imagine-seo-engine/pull/269): verifica que o serviço municipal solicitado existe no catálogo Imagine Comercial **F336**, fixado pela SHA `0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38`, e limita o planejamento inicial a **Onepage e Landing Page**, sem alegar que qualquer município possui atendimento, demanda ou serviços contratados.

## Validação exigida nesta candidata

Toda CI da própria RC67 precisa ser conferida na HEAD final. A integração F180 acrescenta:
1. teste de catálogo F336 real com checkout SHA-pinned e validações Node 22/24;
2. execução **na CI oficial F172** da revisão combinada DTB + F107 + catálogo Comercial F336, sem novo download do IBGE;
3. rejeição de slug comercial inexistente, serviço fora da fase inicial, lote editorial reprovado e alteração não autenticada do CSV DTB;
4. bloqueio de publicação e indexação mesmo em candidatos estruturalmente corretos.

Se a CI da F180 ainda estiver pendente ou houver falha, **não promover a candidata**. Reportar e corrigir a causa sem reduzir os testes.

## Bloqueadores reais

A existência no catálogo não comprova atuação comercial em cada cidade. Antes de produzir URLs municipais indexáveis continuam necessários: serviço disponível e aprovado no Portal, conteúdo local original, procura comprovável, consentimento/permissões por tenant, GSC autenticado no Engine, AppSec/LGPD independente, redirects HTTP/www/en-us e homologação segura da VPS Leaseweb, incluindo backup, restauração e rollback.

O Engine não concede GO por CI verde. Nenhum merge, deploy, DNS, publicação, cobrança ou troca de credenciais.
