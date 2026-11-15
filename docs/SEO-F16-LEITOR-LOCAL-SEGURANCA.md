# SEO-F16 — Proteção das entradas dos CLIs e minimização de diagnósticos

Os CLIs de consultas GSC e comparação de relatórios aceitavam caminhos locais via `stat/readFile`, que seguia links simbólicos. A leitura agora é feita por `readBoundedLocalText`:

- Exige arquivo regular, não symlink, e limite configurável de 5 ou 10 MiB;
- Confere tamanho, inode e dispositivo após abrir com `O_NOFOLLOW` quando suportado;
- Lê em blocos limitados, incluindo proteção se um arquivo crescer após a checagem inicial;
- Nunca envia bytes da fonte para logs; o auditor não imprime URLs inválidas do sitemap em diagnósticos.

Essa proteção não substitui um workspace de arquivos com permissões corretas: mudanças maliciosas em diretórios ancestrais ou sistemas sem `O_NOFOLLOW` exigem isolamento adicional. Testes usam somente fixtures sintéticas.
