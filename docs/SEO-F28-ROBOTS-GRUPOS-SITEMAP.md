# SEO-F28 — Grupos robots.txt e declarações sitemap

Um regex global para `Disallow: /` pode dar falso positivo quando a restrição se destina exclusivamente a `BadBot` e a política `*`/Googlebot permite indexação.

Novo verificador offline percorre diretivas por grupo `User-agent`: para o Googlebot geral, privilegia regras específicas de `googlebot` caso existam; na ausência, usa grupos wildcard `*`. Detecta `Disallow: /` sem `Allow: /` para a raiz. Também confere diretiva `Sitemap:` exata, removendo comentários.

Limitação relevante: não interpreta completamente globs, precedência de caminhos e todos os crawlers Google do RFC 9309. O objetivo é detectar bloqueio total simples e reduzir falsos positivos num build curado, não garantir resultado de indexação nem substituir testes com a propriedade real.
