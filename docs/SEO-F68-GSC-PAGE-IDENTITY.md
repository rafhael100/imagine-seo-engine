# SEO-F68 — Identidade canônica de URL nas comparações query/page

A F57 validava URL com `new URL()` mas deduplicava a string original. O host HTTP(S) não distingue maiúsculas, de modo que `https://www.example.com/a` e `https://WWW.EXAMPLE.COM/a` representavam a mesma página e poderiam ser contados como duas páginas orgânicas.

Agora usa `new URL(page).href` **depois** da validação conservadora de URLs (F62/F64) tanto na deduplicação de `(consulta,página)` quanto no conjunto de páginas por consulta. Duplicatas de identidade canônica são rejeitadas em vez de gerar indício de canibalização. Paths com capitalização diferente e hosts distintos permanecem páginas separadas, pois a aplicação pode distingui-los.

Testes sintéticos garantem: alias de host recusado como par duplicado; páginas distintas contam normalmente. Nenhuma consulta ou URL bruta no resultado; sem OAuth, dados reais, publicação, deploy ou merge `main`.
