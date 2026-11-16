# SEO-F26 — Metadados no contexto HTML correto

O auditor independente verificava `title`, canonical e meta tags com regex em todo o arquivo. Essa simplificação permitia que uma tag em comentário ou no corpo da página mascarasse uma falha do cabeçalho efetivo.

Agora a análise técnica limita `title`, `meta name=description`, `meta name=robots`, `rel=canonical` e `meta property=og:url` ao conteúdo do primeiro `<head>...</head>`, excluindo comentários HTML, com testes de regressão. Links de navegação, H1 e JSON-LD continuam analisados no restante da página.

Não é um parser HTML5 normativo. O formato deve ser HTML pré-compilado confiável; documentos estruturalmente malformados ainda devem passar por QA de navegador. Não há rede, indexação, OAuth ou publicação.
