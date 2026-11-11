# SEO-F12 — Leitura robusta de HTML na auditoria local

- O auditor já rejeitava links simbólicos no inventário, mas havia uma janela entre `lstat` e `readFile` na qual o arquivo poderia ter sido trocado por um link simbólico.
- `readSafeHtmlFile` abre o arquivo com `O_NOFOLLOW` (quando disponível), confirma tipo e limite de 2 MiB **após abrir**, e encerra o descritor.
- `auditStaticSite` relata `unsafe_html_file` quando detecta arquivo removido ou trocado por symlink, sem ler seu conteúdo.
- URLs de links `data:`, `file:`, `vbscript:` ou com credenciais são bloqueadas no relatório.

Limitação importante: troca de **diretórios pais** entre a listagem e a leitura não é integralmente protegida; usar somente diretórios de build de origem confiável, com controle de permissões. Nada é baixado, publicado ou modificado.
