# SEO-F62 — Recusa de aliases ambíguos de URL antes da análise query/page

O motor F57/F59 preserva a identificação de páginas fornecidas em respostas GSC, mas os parsers de URL podem reescrever segmentos `..`, caminhos com `//`, barras invertidas e escapes `%2e/%2f/%5c`. F62 rejeita essas grafias **antes da normalização WHATWG** para não associar acidentalmente uma consulta à página errada. Também rejeita porta explícita, credenciais na URL, query string, hash e ausência de caminho `/`.

URLs HTTPS canônicas dentro da propriedade continuam permitidas, incluindo codificação segura como `%20`. As propriedades de tipo `sc-domain:` continuam cobrindo subdomínios legítimos, mas não domínios parecidos; prefixos URL mantêm semântica literal para a propriedade exata.

O processamento segue offline, com termos e URLs omitidos da saída, sem operações de rede nem publicação. CI usa apenas dados sintéticos e testes adversariais. **HOLD:** nenhuma autenticação OAuth própria do Portal, dados reais no Git, DNS, redirects, deploy, merge `main` ou custos adicionais; revisão independente de segurança e homologação são necessárias.
