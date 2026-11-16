# SEO-F25 — Cabeçalho técnico de páginas públicas

`auditStaticSite(root,{siteUrl,strictPublicHead:true})` e o CLI `node scripts/audit-dist.mjs dist https://site.example/ --strict-public-head` ativam um gate adicional:

- Exatamente um `meta name="robots"` válido, com `index,follow`;
- Exatamente um `meta property="og:url"` igual à URL canônica esperada;
- 404 é excluída do inventário público, evitando falsa exigência de indexação;
- Falha de build via código de saída 1 em qualquer erro.

A rotina não faz HTTP nem consulta mecanismos de busca, e não demonstra que a página foi indexada. É um reforço opt-in para o site comercial já curado; não é uma regra universal para páginas não indexáveis ou sites gerados por terceiros.
