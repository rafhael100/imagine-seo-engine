# SEO-F76 — UTF-8 estrito em leituras locais

O helper compartilhado `readBoundedLocalText` deixava o decoder padrão de `Buffer.toString('utf8')` substituir bytes inválidos pelo caractere U+FFFD. Em arquivos locais potencialmente contendo dados privados, isso pode mascarar corrupção da entrada antes da interpretação de CSV/JSON.

A F76 usa `TextDecoder('utf-8',{fatal:true,ignoreBOM:true})` depois de juntar todos os blocos limitados. Sequências UTF-8 incompletas, inválidas ou não canônicas geram o erro sanitizado `SEO input: invalid UTF-8` e são rejeitadas. A codificação UTF-8 válida, mesmo quando um caractere cruza o limite interno de leitura de 64 KiB, permanece legível; o BOM permanece visível como antes. Os limites de bytes, proteção contra symlink e arquivo regular não foram relaxados.

Testes sintéticos cobrem sequência truncada, byte de continuação inválido, sequência overlong e caractere válido dividido entre duas leituras. Nenhum arquivo privado real em Git/CI, chamada de rede, deploy, publicação ou merge main.
