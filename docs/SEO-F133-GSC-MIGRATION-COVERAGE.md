# SEO F133 — GSC páginas observadas × inventário de URLs legadas com 301

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da F132, F131 e F127–F129. O comparador é **offline e somente leitura**; não extrai URLs do Google nem publica redirects.

## Objetivo

Uma auditoria de mapeamentos 301 pode passar quando as URLs antigas fornecidas pelo operador estão mapeadas; contudo, uma URL histórica **observada nos dados por página do GSC** pode ter sido esquecida no inventário legado. A F133 confronta as duas evidências, **sem imprimir ou versionar URLs reais**.

`reviewOfflineGscLegacyMigrationCoverage({gscPageInput,legacyMigrationInput})` valida integralmente os contratos F131 e F127 antes de confrontar qualquer linha. Exige propriedade de domínio GSC e origem canônica iguais ao domínio/URL de migração F127.

- Conta páginas GSC que já são canônicas em `targetRoutes`.
- Conta páginas GSC legadas com candidato `301` explícito no inventário F127.
- Bloqueia quando uma URL GSC legada observada (mesmo HTTP ou www) **não** tem candidato mapeado.
- Bloqueia subdomínios não cobertos pelo escopo F127, sem tentar redirecioná-los.
- Bloqueia quando restam páginas para paginar, há erro F127, tradução incompatível ou dados privados.
- Caso exista URL com parâmetros ou fragmentos, a F131 oculta todos os dados de origem e F133 **não calcula nenhuma métrica de cobertura**.
- Devolve somente índices de linhas e contagens (máximo 200 diagnósticos), nunca domínio, URL, caminho, consulta, identificador de cliente ou hash.

## Restrições

As linhas do GSC e o inventário são **fornecidos pelo operador**, não autenticados por esta biblioteca. Ausência de URL no GSC não é prova de ausência no índice; presença não comprova status atual HTTP ou necessidade editorial de redirecionar. O resultado `human_independent_redirect_review_required` significa somente que todas as URLs fornecidas estão cobertas, e **não** que elas possam ser publicadas.

Ainda requer validação de equivalência de conteúdo, verificação HTTP real em staging, autenticação de propriedade/tenant GSC no Portal, decisão sobre host canônico, revisão SEO e rollback. Não registrar dados reais do Google em PRs públicos.

Os testes utilizam apenas `example.test` e dados totalmente fictícios.
