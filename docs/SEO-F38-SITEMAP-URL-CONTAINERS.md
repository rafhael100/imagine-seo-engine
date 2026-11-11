# SEO-F38 — Validação estrutural de URLs em sitemap

O auditor já verificava se as URLs de um sitemap existiam no build, mas podia aceitar uma `loc` fora de um contêiner `url` — forma estruturalmente inválida de um sitemap XML de URLs.

Em `--strict-public-head`, agora:
- cada elemento `<url>` deve conter exatamente uma `<loc>`;
- não deve haver `<loc>` avulsa fora de `<url>`;
- elementos `<url>` sem `<loc>` ou com duplicação são rejeitados;
- as verificações existentes de origem, canonical, comentários e limites permanecem.

O modo não estrito continua compatível com fixtures sintéticas legadas. Essa regra é um verificador estático de estrutura básica, não um parser normativo XML/DTD ou validador de schemas.
