# SEO F196 — proteger a leitura de inventários Docker da Leaseweb

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Risco corrigido

O preflight de isolamento Docker F147 aceita inventários privados contendo nomes de containers, redes, volumes e portas. Antes da F196, o CLI analisava o JSON de forma conservadora, mas **não exigia que o arquivo original e sua pasta fossem privados**; era possível ler um inventário `0644` numa pasta `0755`, ou diretamente dentro de um checkout Git, expondo topologia operacional por um erro de custódia.

## Mudanças

O comando `scripts/review-staging-docker-inventory-offline.mjs` passa a exigir:
- arquivo absoluto/canônico, regular e não simbólico, de propriedade do operador, com permissões efetivas de acesso privado `0600`;
- diretório pai real, sem symlink intermediário, exclusivo do operador (`0700`);
- nenhum ancestral `.git` (inclusive worktree/submódulo) para impedir armazenamento de topologia no controle de versão;
- tamanho limitado e **mesmo inode/dispositivo** após abertura read-only antes do JSON ser interpretado;
- erro genérico sem vazamento de nomes, portas, caminhos ou identificadores.

O contrato F147 de conflitos de portas, nomes e recursos não foi alterado, assim como seus resultados `HOLD`, sem reservar porta nem executar Docker. O CLI continua sem rede, sem credenciais SSH e sem mudar configuração de VPS.

## Evidência e limites

A CI F147 existente (Node 22/24) executa teste de fonte segura, pasta pública, arquivo público, symlink e árvore Git, além da suíte completa de isolamento. **Isso não constitui inventário autenticado da Leaseweb nem autoriza iniciar containers**. O operador precisa fornecer a captura real via F148 em diretório privado, revisar recursos e portas atuais e obter aprovação de staging.

Continua o trabalho da [RC73 #290](https://github.com/rafhael100/imagine-seo-engine/pull/290), da proteção de Compose [#292](https://github.com/rafhael100/imagine-seo-engine/pull/292) e da atualização Comercial F348 [#293](https://github.com/rafhael100/imagine-seo-engine/pull/293). Bloqueadores restantes: OAuth GSC real por tenant, AppSec/LGPD independente, TLS/301 na VPS, backup/restauração/rollback e GO humano.
