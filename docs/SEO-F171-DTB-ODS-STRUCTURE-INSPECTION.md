# SEO F171 — inspeção da planilha ODS original DTB 2025

A captura F170 [PR #257](https://github.com/rafhael100/imagine-seo-engine/pull/257) obteve o arquivo diretamente do GeoFTP oficial do IBGE por TLS, com SHA-256 `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`.

A F171 baixa o binário original uma vez em runner descartável e **exige essa SHA imutável antes de abrir** o relatório municipal ODS contido no ZIP. Usa apenas a biblioteca padrão Python/ZIP/XML para examinar nomes das planilhas, linhas não vazias, células com 7 dígitos e um pequeno exemplo de cabeçalho, a fim de identificar o contrato real das colunas antes de implementar a reconciliação territorial.

Não grava XLS/ODS, CSV, nomes de municípios em arquivos de repositório, GSC, VPS ou portal; não gera páginas. O resultado de inspeção de estrutura não é uma validação dos 5.569 municípios, não identifica as duas unidades estatísticas especiais e não concede autorização de publicação.

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Requisições oficiais não devem ser repetidas continuamente. Prosseguir para comparação de geocódigos somente após entender a estrutura verdadeira do workbook.
