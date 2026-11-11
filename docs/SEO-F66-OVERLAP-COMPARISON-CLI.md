# SEO-F66 — Comparação offline de consultas e páginas por CLI

Execute `node scripts/compare-gsc-overlap-offline.mjs /caminho/privado/dois-periodos.json` com dados Search Analytics `query,page` divididos em `previous` e `current`, cada um com `scope` (empresa, propriedade, fingerprint, datas e limite) e `response` (linhas originais). Não são aceitas métricas calculadas pelo operador como prova de resultado.

A CLI usa o comparador F65, revalida as linhas via F57/F64, limita a leitura a 10 MiB, não segue symlinks finais, não inclui parâmetros de cliente em erros e nunca imprime termos, URLs, nomes de arquivos, sessões ou tokens. Respostas parciais impedem alertas de tendência. Uso exclusivamente local, sem requisição ao Google.

**HOLD:** resultados informativos de revisão, não autorização de publicação, OAuth do Portal, dados de clientes em CI, DNS, redirecionamentos, deploy ou merge `main`. Antes do uso real, faltam IAM/consentimento do tenant, revisão AppSec/DBA/LGPD e homologação autenticada.
