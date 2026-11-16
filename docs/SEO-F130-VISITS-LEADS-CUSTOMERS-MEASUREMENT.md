# SEO F130 — prontidão de medição Visitas → Leads → Clientes

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua RC47 [#187](https://github.com/rafhael100/imagine-seo-engine/pull/187), sem configurar Google Analytics, sem enviar eventos e sem dados pessoais no GitHub.

## Motivação

O produto Imagine usa três pilares: **visitas, leads e clientes**. O modelo F106 já preserva a distinção crítica: cliques GSC não são visitas, leads nem clientes. Para tornar esse funil mensurável será necessário acompanhar eventos de captação reais no GA4 e vincular os leads/clientes a uma fonte autorizada no CRM.

A função `reviewGa4FunnelKeyEventReadiness({sourceType,webStreamCount,keyEventNames})` valida, **offline**, um snapshot mínimo de configuração fornecido pelo operador. Exige `sourceType: "operator_supplied_ga4_configuration_unverified"`. Um evento `purchase` isolado não prova aquisição de clientes de serviços nem registro de leads. Para o estágio de **captação**, o evento recomendado `generate_lead` deve estar registrado como *key event*, e depois seu disparo e consentimento devem ser comprovados em teste autorizado. Outras convenções de evento só devem entrar após mapeamento aprovado.

A presença de um key event configurado não demonstra evento enviado, volume de leads, atribuição ou fonte Google autenticada. Os três valores `VISITAS`, `LEADS` e `CLIENTES` e todas as taxas ficam `null` até a implementação de fontes reais. Nenhum valor é imputado com base em GSC.

## Contrato de segurança

- Somente enumeração de nomes de evento GA4 normalizados e quantidade de streams da web. Rejeita esquema extra, objetos com getters, arrays esparsos, duplicação, event names inseguros e entradas acima do limite.
- Retorna `configuration_corrections_required` se não há web stream ou não consta `generate_lead` como key event, senão `independent_measurement_review_required`.
- Não expõe eventos personalizados desconhecidos nem identificadores em saída de diagnóstico.
- Nega explicitamente identidade Google, consentimento, evento real enviado, autorização CRM/tenant, publicação de números e exibição ao cliente.

## Integração posterior

1. No site Imagine Comercial: implementar `generate_lead` **somente depois** de submissão válida e confirmação de sucesso do formulário/CRM, com identificador de evento opaco, deduplicação e sem e-mail, telefone, CPF ou nome enviados ao GA4.
2. No Portal/CRM: registrar lead e transição de negócio com autorização por organização e consentimento, não inferindo `CLIENTES` a partir do evento GA4 `purchase`.
3. Validar coleta de `session_start`/sessões no GA4, atribuição e limites de retenção; confrontar com GSC e proteger cross-domain.
4. Fazer testes com eventos de laboratório e opt-in consentido, confirmar GA4 DebugView/Realtime e respostas idempotentes do CRM. Autorização operacional e revisão LGPD independentes obrigatórias.

**F130 é preflight documental/código e não substitui configuração real do Google ou integração de CRM.**
