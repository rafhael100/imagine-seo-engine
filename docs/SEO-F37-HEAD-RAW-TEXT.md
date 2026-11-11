# SEO-F37 — Ignorar HTML literal dentro de scripts e estilos no head

Um arquivo HTML pode conter `<script>const fake = "<title>...</title>"</script>` ou código CSS comentado que referencia uma tag SEO. Antes, a heurística de metadados poderia identificar essas tags como reais.

O auditor agora remove somente elementos script/style do texto do head que alimenta a análise de title, meta description, canonical, robots e Open Graph. O JSON-LD continua sendo verificado separadamente, preservando o gate de dados estruturados.

A análise é estática e limitada: não é um parser DOM completo, não acessa URLs ou Search Console, não autoriza deploy nem substitui QA de navegador.
