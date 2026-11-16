# Imagine SEO — RC37, apresentação e handoff com privacidade

**Base:** [RC36 #124](https://github.com/rafhael100/imagine-seo-engine/pull/124) (SHA `440d515c1094ed5c8e0094c5c614fe1d6d49d881`). **Entregas novas:**

- [SEO-F86 #125](https://github.com/rafhael100/imagine-seo-engine/pull/125) — contrato `seo-gsc-organic-trend-display-offline-v1` calculado de **duas exportações originais**, não de resumos recebidos; suprime comparações e sinais se qualquer período contém linha redigida. CLI com leitura local limitada 10 MiB, UTF-8 estrito, sem symlink final e sem parâmetros extras.
- [SEO-F87 #126](https://github.com/rafhael100/imagine-seo-engine/pull/126) — reforça o resumo executivo `seo-brief-offline-v1`, que antes podia encaminhar variações orgânicas a partir de uma amostra com consultas ocultadas. Agora exige inteiro `summary.redactedRows` válido; quando positivo, `organic=null` e apenas recomendações técnicas independentes permanecem, inclusive no handoff para o Portal.

## Evidências verificadas

- F86: CI completa em Node 22 e 24 [#43126759104](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43126759104), **SUCCESS**.
- F87: CI completa em Node 22 e 24 [#43127181278](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43127181278), **SUCCESS**.
- RC37: executar novamente a CI sobre a branch de release, incluindo tests do Portal handoff, CSV, query/page, CLI e F86/F87. A CI de RC37 não substitui revisão independente.
- O auditor do Imagine Comercial na [PR #237](https://github.com/rafhael100/imagine-comercial/pull/237) permanece pinado na RC36 (`440d515c1094ed5c8e0094c5c614fe1d6d49d881`), que passou no build de QA. **Não alterar o pin do Comercial para esta RC37 automaticamente.**
- A [PR #408 do Portal](https://github.com/rafhael100/imagine-portal/pull/408) segue com contrato RC32/F79 pinado e passou na sua matriz CI. Uma futura atualização do Portal requer testes de compatibilidade com o envelope RC37 e autenticação real.

## Comportamento de privacidade

Quando qualquer consulta do comparativo original contém e-mail, telefone ou documento filtrado, a apresentação F86 recusa deltas e segmentos comparativos; o resumo F87 não encaminha métricas orgânicas ou sugestões GSC para handoff. Permissões de Google/OAuth, propriedade, tenant, cliente, publicação e acesso de rede continuam **falsas**. Os CSVs e relatórios são fornecidos pelo operador e **não representam tráfego Google completo ou autenticado**.

## Gates pendentes

A integração operacional depende de revisão independente AppSec/SEO/LGPD, sessão MFA e grants por empresa/propriedade, OAuth consentido, isolamento de dados e backup/rollback, homologação de staging e autorização específica. **DRAFT/NO-GO:** sem merge em `main`, Google API real, dados de clientes, redirect 301, DNS, deploy, cobrança ou acesso a produção.
