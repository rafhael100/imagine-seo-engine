# SEO-F8 — Proteção das entradas do auditor estático

A auditoria local é somente leitura, mas recebe pastas compiladas possivelmente controladas por terceiros. Por isso:

- HTML já tinha limite individual de 2 MiB e proibição de symlink.
- `robots.txt` e `sitemap.xml` passam a exigir arquivo regular, máximo 5 MiB e abertura sem seguir symlink (`O_NOFOLLOW` quando suportado).
- O `siteUrl` usado como base do relatório não pode conter usuário, senha, porta customizada, query ou fragmento.
- Casos sintéticos exercitam tentativa de leitura de outro arquivo local por symlink e recurso desproporcional.

Limitações: o parser HTML é intencionalmente simplificado, não faz crawling HTTP, não confere indexação no Google nem substitui browser, Lighthouse e inspeção humana. Não usar dados reais/segredos nos fixtures.
