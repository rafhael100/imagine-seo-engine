# SEO-F33 — Orçamentos anti-exaustão do auditor local

Mesmo com arquivos HTML limitados a 2 MiB, grandes quantidades de links e apontamentos podem elevar o custo de uma auditoria de muitas páginas. O motor agora falha sem saída parcial ao ultrapassar:
- 50.000 erros e avisos somados;
- 1.000 tags âncora por página e 100.000 links internos em todo o build;
- 128 scripts JSON-LD por página;
- 10.000 linhas com conteúdo no robots.txt;
- 20.000 elementos `loc` no sitemap.

Esses valores são máximos internos para builds locais curados e não podem ser aumentados por opções da API. Os orçamentos anteriores de arquivos, diretórios, profundidade e bytes continuam aplicáveis.

Limitações: os limites não substituem isolamentos do workspace, quotas de tempo/memória do processo CI ou a avaliação real de conteúdo em navegador/Google.
