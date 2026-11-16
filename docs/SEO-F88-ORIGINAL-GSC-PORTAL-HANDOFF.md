# SEO-F88 — Handoff do Portal recalculado a partir de evidências GSC originais

## Por que é necessário

O contrato legado `buildOfflineSeoBrief({audit,trend})` aceita uma tendência já agregada. Mesmo com a supressão de linhas pessoais introduzida pela F87, um chamador pode declarar `redactedRows:0` em um objeto pré-computado. O contrato F88 evita esse caminho **para os novos consumidores**, recebendo somente duas exportações de consultas originais, auditoria técnica offline e escopo de revisão — todos dados ainda fornecidos pelo operador, **não autenticados pelo Google**.

## Fluxo e garantias

`prepareOfflinePortalSeoFromOriginalGsc({audit,previous,current,scope})` executa, na ordem:

1. Rejeita campos extras na entrada ou escopo, protótipos inesperados, símbolos e getters. O escopo inclui exclusivamente `tenantRef`, `propertyFingerprint` e `sourceRevision`.
2. Revalida os dados originais usando F86, incluindo arrays densos e simples, consultas duplicadas, CTR, datas, janelas e bloqueio de autoridade forjada.
3. Recalcula a tendência usando `compareGscPeriods` das **mesmas linhas originais**, sem aceitar `trend`, `summary` ou sinais enviados por terceiros.
4. Aplica F87 no resumo executivo; com qualquer consulta pessoal oculta, remove **todos** os totais, deltas e ações orgânicas, preservando apenas ações técnicas independentes (canonical, sitemap, links).
5. Gera `preparePortalSeoHandoff` com permissões sempre negativas, sem enviar termos, URLs ou mensagens privadas.

A saída `seo-portal-original-gsc-handoff-offline-v1` inclui contagens limitadas, o briefing e o envelope de Portal. `oauthVerified`, `propertyAuthorizationVerified`, `backendTenantGrantVerified`, `customerDisplayAuthorized`, `publicationAuthorized` e `networkPerformed` continuam **false**. O `sourceRevision` é autodeclarado e **não constitui assinatura de origem ou acesso autorizado**.

## Comando seguro

```bash
node scripts/prepare-portal-original-gsc-handoff-offline.mjs private-original-evidence.json
```

O comando lê até 10 MiB, exige UTF-8, recusa symlinks finais, argumentos extras, JSON inválido e mensagens que revelem nomes de arquivos. Testes de função e CLI cobrem entrada limpa, CPF fictício, dados de auditoria privada, tentativas de falsificar autorização, alterações no formato, janelas incorretas, consultas duplicadas e ausência de dados pessoais na saída.

## Limites

Esta função **não substitui automaticamente** a CLI antiga nem prova que a fonte é Google; ela fornece um caminho mais seguro a ser adotado explicitamente em futuras integrações. Os dados podem ser incompletos devido a anonimização, limites ou paginação do provedor.

**NO-GO:** revisão independente AppSec/LGPD/SEO, grants por empresa e propriedade, MFA, consentimento OAuth, staging e aceite de release continuam obrigatórios. Sem chamadas Google, dados reais de clientes, publicação, DNS, 301, cobrança, merge em `main` ou deploy.
