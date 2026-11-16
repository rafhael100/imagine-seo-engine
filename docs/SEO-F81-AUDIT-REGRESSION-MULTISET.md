# SEO-F81 — Contagem correta de problemas repetidos no gate de builds

## Falha anterior

A comparação `compareStaticAuditReports` convertia observações em `Map(key → issue)`, descartando ocorrências repetidas com a mesma severidade, categoria e arquivo. Um build com um link quebrado e o seguinte com três links quebrados do mesmo tipo na mesma página poderiam aparecer com **zero novos avisos** quando os limites totais da política permitissem três. Isso tornava `maxNewErrors` / `maxNewWarnings` incapazes de detectar parte das regressões.

## Correção

- O comparador passa a usar **multiconjuntos** (contagem por chave `severity:type:file`) e calcula `max(0, novos - antigos)`. Se havia uma ocorrência e aparecem três, são **duas regressões**, não zero.
- A saída `introduced` e `resolved` representa cada ocorrência nova/removida, ordenada deterministicamente; conteúdo livre de mensagens de auditoria continua descartado.
- Agora as opções de política só admitem as seis chaves oficiais de `LIMITS`, exigem objetos de dados simples e rejeitam getters, chaves Symbol, herança não autorizada e atributos extras silenciosos.
- A semântica dos limiares permitidos continua a mesma; a melhora está na **precisão da contagem**. Problemas reais de mesma categoria podem existir várias vezes em uma página.

## Testes

Casos de duplicatas crescentes e resolvidas, mistura entre erro/aviso com mesmo identificador, bypass de política com `approvalOverride`/getter/Symbol, ausência de vazamento de mensagens privadas e preservação de políticas legítimas.

**Sem deploy nem acesso a dados reais.** Esta alteração é candidata a integrar o auditor estático do Imagine Comercial por atualização explícita do SHA pinado após passar em CI e revisão. Não mesclar em `main` ou aplicar no Comercial em produção automaticamente.

## CLI endurecida

O comando `compare-audit-offline.mjs` agora rejeita qualquer terceiro argumento em vez de ignorar flags extras como `--allow-new-issues`. O teste smoke invoca o CLI com relatórios válidos e uma flag falsa, exigindo erro sem imprimir caminhos privados. Essa correção preserva o contrato de dois arquivos obrigatórios e evita que um operador suponha ter usado uma opção não suportada.
