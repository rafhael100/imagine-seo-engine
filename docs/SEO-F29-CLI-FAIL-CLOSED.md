# SEO-F29 — Auditor CLI fail-closed
O auditor antes ignorava flags desconhecidas. Um simples typo no CI (por exemplo `--fail-on-warning`) fazia com que um build com avisos fosse aceito.

A entrada é agora interpretada por um parser independente que:
- permite exatamente dois flags conhecidos, cada um uma única vez;
- recusa flags com erros de digitação, duplicatas e mais de dois posicionais;
- permite flags em qualquer posição para scripts de CI;
- não inclui valores não confiáveis nos erros.

O CLI não publica, não acessa GSC e não altera o comportamento do auditor para invocações válidas.
