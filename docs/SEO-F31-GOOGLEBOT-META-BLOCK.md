# SEO-F31 — Diretivas de indexação específicas do Googlebot

Uma página com `meta name="robots" content="index,follow"` ainda pode bloquear o Google por `meta name="googlebot" content="noindex"`. O auditor passa a detectar essa contradição e outros sinais críticos.

São bloqueadas como problemas de indexação/navegação:
- `robots` com `noindex` ou `none`;
- `googlebot` com `noindex`, `none` ou `nofollow`;
- no modo estrito, múltiplas metas `googlebot` que tornariam as regras ambíguas.

As entradas são processadas só no `<head>` efetivo, sem entrar em mensagens no relatório ao cliente. Não é um verificador de headers HTTP `X-Robots-Tag`, configurações de CDN ou de Google Search Console em produção.
