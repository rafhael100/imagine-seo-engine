# SEO-F19 — Leitura de builds com teto estrito de bytes
A auditoria local utilizava `stat` e `readFile` sem fixar o limite de bytes quando um arquivo mudava durante a leitura. Agora HTML (2 MiB) e robots/sitemap (5 MiB) reutilizam `readBoundedLocalText`, verificando inode e bytes lidos após abrir, com `O_NOFOLLOW` em plataformas suportadas.

Mantém o tratamento de symlinks e recursos ausentes e não carrega arquivos maiores. Os relatórios e os dados de teste continuam offline.

Limitação: não há proteção contra troca hostil de diretórios pais do build, e não há parser HTML/Sitemap XML de navegador ou crawler de rede.
