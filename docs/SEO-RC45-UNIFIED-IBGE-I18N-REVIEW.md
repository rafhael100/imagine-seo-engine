# Imagine SEO Engine RC45 — integração de frentes paralelas

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

## Frentes consolidadas

Esta branch parte da [RC43 de integridade municipal #175](https://github.com/rafhael100/imagine-seo-engine/pull/175) e incorpora exatamente os quatro arquivos da entrega independente [F117 de coerência de idiomas #167](https://github.com/rafhael100/imagine-seo-engine/pull/167), sem sobrescrever as implementações de origem IBGE, tipologia territorial, SHA-256 ou divisão de CI das F117–F120.

A integração foi segura porque, antes de copiar os arquivos, verificamos que `src/audit-static.mjs`, `src/geo-static-build-review.mjs` e os testes dessa revisão **não haviam sido modificados** por nossa linha F117–F120 em relação à RC42. Os três arquivos agora correspondem exatamente à versão revisada na #167; a documentação de idioma também foi preservada.

## Novos controles na mesma branch

- A F114 compara URLs declaradas com HTML real do build; a F117 de idioma também compara `<html lang>` com `pt-BR`, `en-US`/ `en` ou `es-ES`/ `es`, sem tolerar páginas no idioma errado.
- A F113 impede vazamento de prévias privadas, e a F115 comprova o comportamento no Astro multilíngue real.
- As F118/F119 mantêm exceções territoriais e importação offline com checksum externo; a F120 separa a validação do código da consulta HTTPS real do IBGE.

## Testes e evidências

- `npm test` completo em Node 22 e Node 24.
- Workflow de paridade Astro Comercial, com compilação do código fixo e auditoria de hreflang/URL.
- Workflow de mutação de prévias privadas, com restauração do HTML Astro após cada ataque sintético.
- Workflow F120 de contratos IBGE (Node 22/24); **job de conexão real IBGE não é executado automaticamente**.
- Revisão do diff completo com `main` antes de qualquer merge.

## Limites de produção

O fato de todos os testes offline passarem não comprova consulta IBGE efetuada, edição territorial atualizada, autorização Google OAuth, login/MFA real do Portal, publicação do Imagine Sites ou dados de clientes. É obrigatória execução bem-sucedida do gate HTTPS oficial `verify-official-ibge` e revisão humana posterior de classificação territorial, além das revisões de segurança, LGPD, SEO editorial e homologação VPS.

Não faz merge, deploy, indexação, alteração de DNS ou cobrança.

**RC45 é uma revisão técnica unificada, não uma release de produção.**
