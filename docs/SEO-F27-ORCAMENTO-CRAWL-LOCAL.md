# SEO-F27 — Orçamentos de percurso do build local

Auditar uma pasta com diretórios muito numerosos ou profundos pode consumir CPU e memória mesmo com limite de 20.000 páginas HTML. O enumerador passou a usar `opendir` como iterador e impõe:

- Até 5.000 diretórios incluindo a raiz;
- Até 100.000 entradas percorridas;
- Profundidade até 32, com raiz=0;
- Até 20.000 HTML; teto de bytes por arquivo e restrição de links simbólicos continuam válidos.

`crawlLimits` no código é opcional e apenas reduz limites para um teste. Não existe flag de CI que eleve recursos por conveniência. Ultrapassar um teto rejeita o relatório inteiro com exceção controlada (sem aprovar auditoria parcial).

Permanecem fora do escopo adversários capazes de trocar diretórios pais do workspace e validação por navegador/HTML5.
