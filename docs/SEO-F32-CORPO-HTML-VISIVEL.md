# SEO-F32 — Estrutura visível em HTML estático

Uma auditoria baseada em regex no arquivo inteiro poderia aceitar `<h1>` dentro de comentários, literais JavaScript ou dentro de `<head>`, assim como criar falsos links internos a partir de código não renderizado.

A leitura do build agora separa:
- `<head>` para metadados SEO;
- `<body>` sem comentários, `<script>` e `<style>` para H1 e links internos;
- HTML sem comentários para scripts JSON-LD.

Continua sendo um analisador estático e limitado, não um DOM de navegador ou rastreador JavaScript. Páginas com hidratação dinâmica precisam de testes em browser; alterações no CSS não são interpretadas.
