# SEO F175 — confronto de dois produtos oficiais IBGE 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

A F170/F172 obteve por HTTPS/TLS o arquivo DTB 2025 original e verificou seus 5.571 códigos territoriais; a F174 [PR #261](https://github.com/rafhael100/imagine-seo-engine/pull/261) obteve o arquivo de **Áreas Territoriais 2025**, também do IBGE, mas publicado como produto diferente.

## Cadeia de custódia

Os downloads efêmeros de ambos os originais são limitados, sem redirecionamento, sem retries e com hashes imutáveis exigidas antes da análise:

- DTB 2025 ZIP: `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`.
- Áreas Territoriais 2025 ODS: `029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1`.
- CSV DTB privado normalizado na F172: `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`.

A F175 lê a aba `AR_BR_MUN_2025`, interpreta as colunas oficiais `CD_UF`, `NM_UF_SIGLA`, `CD_MUN` e `NM_MUN`, e confronta com a DTB em **código, UF e nome normalizado**. Os resultados mostram somente contagens, nunca o cadastro.

## Critérios

- Espera 5.571 entradas únicas e 27 UFs em cada produto.
- Distingue 5.569 municípios dos dois registros territoriais especiais.
- Qualquer código não coberto, código extra, divergência de UF ou nome mantém `HOLD_OFFICIAL_PRODUCT_DISAGREEMENT`.
- Concordância estrutural também mantém `HOLD_EXTERNAL_EDITORIAL_AND_OPERATIONAL_REVIEW`.

Mesmo quando não houver divergência, **não são duas autoridades independentes**: ambas as publicações são do IBGE. O fluxo não prova que municípios foram atendidos pela Imagine, não aprova conteúdo local, nem concede permissão de indexação.

## Execução

A CI usa somente Python padrão e um runner descartável; nunca envia as planilhas, JSON ou CSV como artefato ou commit. Os testes unitários usam dados fictícios e incluem divergência de nome, UF, código e entradas inválidas. Não altera `main`, DNS, VPS, Search Console, CRM ou Portal.

Permanecem pendentes os gates de integração GSC por tenant, revisão editorial e legal, segurança, staging Leaseweb, backup/restauração, rollback e decisão humana.
