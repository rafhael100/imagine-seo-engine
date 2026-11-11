# SEO-F20 — Segurança dos diagnósticos CLI
`JSON.parse` lança `SyntaxError` cujo texto pode reproduzir fragmentos do arquivo informado. Erros de filesystem podem incluir caminhos locais sensíveis. Os sete comandos de linha de comando passam a usar:

- `parseSafeJson`: sempre retorna `SEO input: invalid JSON` sem conteúdo;
- `safeCliDiagnostic`: permite somente mensagens de validação com prefixos e caracteres restritos; erro desconhecido vira `input_rejected`;
- Testes com conteúdo privado **fictício** e caminhos fictícios para provar que logs não expõem segredos.

Isso não impede que o usuário imprima deliberadamente relatórios com caminhos no output normal de auditoria. Para dados reais, ambiente privado e políticas de acesso continuam necessários.
