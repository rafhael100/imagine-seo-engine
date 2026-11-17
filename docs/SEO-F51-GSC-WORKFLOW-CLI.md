# SEO-F51 — CLI de revisão integrada GSC offline

Execute `node scripts/review-gsc-workflow-offline.mjs /caminho/privado/fixture.json` somente em workspace confiável. O arquivo local fornece `tenantRef`, `requestedProperty`, `listedProperties`, `plan` e `pages` conforme o contrato F50.

O CLI lê até 5 MiB, rejeita symlinks finais, entradas inválidas e argumentos extras. A saída contém apenas agregações sanitizadas e `HOLD_EXTERNAL_BACKEND_VERIFICATION`; erros de parse e caminhos privados não são reproduzidos.

**Não usar CSV/JSON real de clientes em GitHub público ou CI.** Esta CLI não efetua OAuth, rede, leitura Google, autenticação do Portal, armazenamento de tokens nem publicação. Revisão independente, acesso autorizado e staging são pré-condições para operar com dados reais.
