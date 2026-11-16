# SEO F176 — identificar os dois códigos adicionais de Áreas Territoriais 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

Na [F175 #262](https://github.com/rafhael100/imagine-seo-engine/pull/262), a comparação de duas publicações oficiais IBGE diferentes, ambas fixadas por SHA-256, demonstrou que os 5.571 códigos da DTB 2025 estão incluídos nas Áreas Territoriais 2025 e coincidem em UF e nome. Entretanto, a segunda publicação contém **dois códigos adicionais**.

A F176 executa uma revisão excepcional e limitada para identificar **somente esses dois códigos e seus nomes administrativos públicos**. O arquivo DTB e a planilha de Áreas permanecem em runner descartável; seus hashes anteriores devem conferir antes da leitura. O resultado não contém o conjunto de municípios, registros privados ou arquivos brutos.

**A identificação de nomes e códigos não equivale à classificação jurídica das unidades.** O estado permanece `HOLD_TERRITORIAL_UNIT_CLASSIFICATION`, e a decisão de publicar páginas municipais continua condicionada à autenticidade e edição das bases, atendimento real, conteúdo útil original, revisão editorial, GSC por tenant e homologação segura da VPS. A API Localidades continua indisponível neste ambiente. Nenhum redirect, DNS ou deploy está autorizado.
