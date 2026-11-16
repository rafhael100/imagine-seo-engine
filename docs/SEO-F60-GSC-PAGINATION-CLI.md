# SEO-F60 — CLI de análise paginada query/page

Execute `node scripts/review-gsc-query-page-pages-offline.mjs /caminho/privado/gsc-pages.json` com JSON contendo apenas `scope` (empresa, domínio, fingerprint, datas, `rowLimit` por página) e `pages` com `startRow`/`rows` ordenados.

A ferramenta usa o agregador SEO-F59, limita a leitura a **10 MiB** e a **quatro páginas** (máximo 1.000 linhas por página), não segue symlinks finais e não imprime consultas, URLs, tokens ou conteúdo inválido em mensagens de erro. Valores inesperados, offsets incorretos e registros não consecutivos são recusados.

O processo é local e não autentica Google nem Portal; use exportações reais somente se autorizadas, em armazenamento privado, nunca em CI ou repositório público. Não concede exibição a cliente, não cria regra de redirect e não faz deployment. Revisão AppSec/DBA/LGPD e homologação autenticada permanecem em HOLD.
