# SEO-F82 — Argumentos estritos nos comandos GSC offline

Quatro CLIs legados liam somente a quantidade de argumentos esperada e ignoravam silenciosamente argumentos adicionais:

| Comando | Entradas obrigatórias | Regra nova |
|---|---|---|
| `report-gsc-offline.mjs` | export.json | Exatamente 1 |
| `report-gsc-csv-offline.mjs` | export.csv, início, fim | Exatamente 3 |
| `compare-gsc-offline.mjs` | anterior.json, atual.json | Exatamente 2 |
| `compare-gsc-csv-offline.mjs` | anterior.csv, início, fim, atual.csv, início, fim | Exatamente 6 |

Agora qualquer argumento excedente (por exemplo, `--publish`, `--allow-unsafe-query` ou um arquivo extra) dispara o caminho `Usage`, exit code 2, **antes da leitura de evidências**. Nenhuma nova opção é interpretada, nenhum arquivo é escrito, nenhuma chamada de rede é feita.

O teste `tests/gsc-strict-cli-args.test.mjs` invoca cada processo com argumentos extras sintéticos e sem nenhum argumento, e exige stdout vazio e stderr sem nomes de arquivos privados. Os fluxos já existentes de importação e comparação continuam cobertos pelas suites anteriores.

**Controle de autorização:** o uso correto desses comandos não concede consentimento Google, propriedade GSC, identidade de cliente, MFA, tenant grant, exibição de relatórios ou publicação. Todos os dados de prova são sintéticos, sem acesso a contas. RC34 + F82 permanece em revisão sem merge `main` ou deploy.
