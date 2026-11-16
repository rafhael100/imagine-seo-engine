# SEO-F58 — CLI privada de sobreposição `query,page`

Para auditar dados fornecidos localmente, use `node scripts/review-gsc-query-page-offline.mjs /caminho/privado/query-page.json`. O arquivo JSON contém somente `scope` (empresa, propriedade canônica, fingerprint, período e `rowLimit` opcional) e `response` com linhas `keys:[query,page]`, `clicks`, `impressions`, `ctr`, `position`.

A CLI limita a leitura a 5 MiB, rejeita symlinks finais, argumentos inesperados e entradas com alegações falsas de autorização. A saída expõe apenas totais e status de revisão, nunca termos ou URLs brutas.

O uso com dados reais exige que o operador tenha autorização e mantenha os arquivos fora do GitHub/CI, pois o motor não possui OAuth/consentimento próprio. A execução local não contata Google nem OpenSEO, não grava tokens e não autoriza exibição a clientes, deploy, canonicalizações, redirects 301 ou merge na `main`.
