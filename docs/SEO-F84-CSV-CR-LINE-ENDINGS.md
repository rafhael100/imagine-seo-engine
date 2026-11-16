# SEO-F84 — CSV GSC com quebras de linha CR, CRLF e LF

A importação de consultas GSC detectava o separador (`,` ou `;`) usando o cabeçalho extraído por um `split` que reconhecia apenas LF/CRLF. Em CSV legado com quebras **CR-only**, a linha de cabeçalho incluía acidentalmente os dados abaixo; uma consulta entre aspas contendo `;` podia fazer o parser escolher o delimitador errado e rejeitar todo o arquivo.

**Correção:** a primeira linha física agora termina em `\r\n`, `\n` ou `\r`. A escolha do delimitador considera somente o cabeçalho, nunca as consultas. O parser de dados, limites de 10 MiB, células/linhas e proteção de privacidade permanecem os mesmos.

Testes F84 cobrem:
- cabeçalho EN separado por vírgula com CR-only e texto da consulta contendo ponto e vírgula;
- cabeçalho PT-BR com BOM, semicolon e valores/consultas com vírgula em quebras CR-only, incluindo e-mail fictício ocultado na saída;
- compatibilidade com CRLF/LF.

**NO-GO operacional:** exportação local continua sem propriedade real verificada, sem OAuth, acesso Google ou publicação. Testes Node22/24 e revisão AppSec/SEO ainda necessários, sem merge `main`, deploy ou cobrança.
