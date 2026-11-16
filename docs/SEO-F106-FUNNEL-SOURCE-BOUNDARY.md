# SEO-F106 — Visitas → Leads → Clientes: limite entre fontes (offline)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Derivada da etapa F105 / PR #151,
e alinhada à diretriz transversal [PR #152](https://github.com/rafhael100/imagine-seo-engine/pull/152).
O objetivo é preparar um contrato de apresentação seguro para o futuro Portal, sem
confundir dados de busca com resultados comerciais.

## Separação de fontes

| Pilar | Fonte correta futura | Estado nesta etapa |
| --- | --- | --- |
| **Visitas** | Analytics do site autenticado, com definição explícita de visitas/sessões | **Não disponível** |
| **Leads** | Eventos de leads autorizados no CRM Imagine, com atribuição e janela definidas | **Não disponível** |
| **Clientes** | Clientes convertidos confirmados pelo CRM e atribuição autorizada | **Não disponível** |

**Impressões não são visitas. Cliques orgânicos do GSC não são sessões
do site. Cliques não são leads; leads não são clientes.** Quando uma fonte
está ausente, a interface deverá usar *não disponível*, nunca fabricar zero.

O motor F106 aceita apenas o objeto \`comparisonInput\` com dois **snapshots
originais F104**. Recalcula F105 e retorna indicadores
\`organicSearchDiscovery\` **somente** se todas as datas declaradas
tiverem linhas submetidas. Mesmo assim, a fonte permanece não autenticada,
a cobertura Google não é provada, e não se produzem alertas automáticos.
Nenhum outro campo, permissão, suposto total de leads ou origem CRM é aceito.

## Exemplo de operação local

Arquivo privado JSON de topo:

    {
      "comparisonInput": {
        "previous": {"tenantRef": "...", "expectedProperty": "...", "snapshot": {}},
        "current": {"tenantRef": "...", "expectedProperty": "...", "snapshot": {}}
      }
    }

Os objetos de snapshots devem seguir integralmente o [contrato F104](SEO-F104-OPENSEO-DAILY-OFFLINE.md).
Rode no ambiente privado de laboratório, com dados **sintéticos**:

    node scripts/preview-seo-funnel-offline.mjs private-comparison.json

Saída padronizada:
- \`stages\`: três entradas com \`value:null\` e fonte necessária explícita;
- \`conversionRates\`: três relações sempre \`null\`;
- \`organicSearchDiscovery\`: métricas estritamente **de busca**, nunca
  transformadas em visitas; suprimidas com cobertura parcial;
- \`sourceCompletenessNotProven:true\`, \`reviewSignals:[]\`,
  \`customerDisplayAuthorized:false\`, \`productionReadAuthorized:false\`,
  \`networkPerformed:false\`;
- \`releaseStatus:HOLD_IMAGINE_BACKEND_AUTHORIZATION\`.

## Gates futuros

Para trazer **Visitas**, é necessário integrar analytics web real, com
consentimento adequado, definição de sessão, escopo tenant/site e trilha de
auditoria. Para **Leads/Clientes**, o CRM deve entregar eventos autorizados,
atribuição verificável e proteção multiempresa. O Portal precisa validar
sessão/MFA/RBAC e grants próprios; OAuth Search Console do SaaS Imagine não
é herdado do OpenSEO. Ainda pendem revisão AppSec/LGPD/editorial,
homologação na VPS, logs seguros, backup, rollback e aceite de release.

O código não acessa OpenSEO, GSC, CRM, Portal ou analytics pela rede,
não ativa cobrança, não publica páginas e não modifica \`main\`.
