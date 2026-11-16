# SEO F199 — custódia do GSC, manifesto e comprovantes HTTP do preflight F143

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Vulnerabilidade de privacidade corrigida

O comando F143 `scripts/run-served-html-staging-qa.mjs` recebe três arquivos sensíveis: uma exportação `page` GSC, um manifesto de URLs históricas/301 e um arquivo de saída com comprovantes HTTP e `Location` capturados. Embora os resultados na tela sejam redigidos, a implementação anterior aceitava fontes públicas `0644` e pastas `0755`, e só verificava que o output não ficaria dentro do **checkout atual**, sem considerar outro repositório Git ou worktree. Um operador poderia acidentalmente expor informação de cliente/infraestrutura.

## Novo contrato reutilizável

A F199 cria a função offline `reviewPrivateOperatorFilePath`, no módulo `src/private-staging-artifact-custody.mjs`, com:
- fonte **absoluta, canônica**, regular, sem link simbólico, no tamanho permitido, de propriedade do operador e sem acesso de grupo/outros (modo `0600`);
- diretório pai real de propriedade do operador, sem link simbólico e com acesso restrito (`0700`);
- recusa de `.git` em qualquer ancestral (checkout, submódulo ou worktree), tanto na **entrada** como na **saída**;
- confirmação de inode/dispositivo/tamanho no descriptor aberto com `O_NOFOLLOW`, para recusar substituição de fonte entre a inspeção e a leitura;
- caminho de saída igualmente privado, criado com `O_EXCL` e permissão `0600`, jamais sobrescrito, sem imprimir caminho privado ou conteúdo.

O F143 executa essas verificações **antes de qualquer HTTP HEAD/GET em loopback**, e continua exigindo `APP_ENV=testing|staging` e `SEO_F138_LOOPBACK_STAGING` explicitamente. O diretório do **build HTML público** pode continuar dentro do checkout de engenharia, diferentemente dos arquivos privados de GSC e capturas.

## Evidências e regressões

Os testes existentes F143 agora provam que **zero requisições HTTP** são emitidas se o GSC ou manifesto estiverem `0644`, o diretório pai `0755`, a origem ou saída estiver dentro de outra árvore Git, ou a saída apontar a um diretório simbólico. O cenário válido continua a capturar HTTP real local, gravar comprovantes privados e recusar sobrescrita.

As CI F143 e **F150 que inicializa Nginx real via Docker** são ambas disparadas quando o guard F199 muda. O modo Nginx F197 e a RC75 continuam preservados; nenhum teste ou controle de F151/F198 foi reduzido.

## Restantes pendências externas

Os contratos de privacidade de arquivos não autenticam a fonte do Google nem substituem OAuth GSC `webmasters.readonly`/tenant, cofre de tokens, consentimento, MFA ou revogação. Não são prova de HTTPS, TLS ou disponibilidade na Leaseweb. Permanecem revisão AppSec/DBA/LGPD independente, testes operacionais de backup/restauração/rollback, revisão editorial da migração de URLs e GO humano.

Continua a [RC75 #298](https://github.com/rafhael100/imagine-seo-engine/pull/298), que consolida dois modos complementares Docker, F197 e F198, e mantém `main`, DNS, VPS e produção inalterados.
