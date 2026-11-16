# SEO F183 — priorização da migração 301 pelos sinais reais do GSC

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Continuação da [RC67 #270](https://github.com/rafhael100/imagine-seo-engine/pull/270).

## Problema operacional

A F131 separa os sinais por HTTP/HTTPS e www/sem www. A F127 e a F133 conferem se cada URL histórica recebida de uma fonte PAGE tem um candidato 301. Contudo, sem a priorização por cliques e impressões, a equipe pode gastar tempo em URLs de impacto reduzido enquanto páginas antigas com sinais de pesquisa continuam sem cobertura.

## Contrato original e execução

A F183 combina o **resultado recalculado dos contratos existentes F131 + F133 + F127** com as linhas originais da dimensão `page` e o manifesto de redirecionamento de autoria do operador:

`node scripts/review-gsc-redirect-priority-offline.mjs /privado/gsc-page.json /privado/redirects.json`

O CLI exige arquivos privados regulares `0600` em sistemas POSIX, recusa symlinks, limita dados a 5 MB por arquivo e não reproduz paths privados ou detalhes de erros.

A revisão classifica as páginas nas categorias:
- Já canônicas e presentes nas rotas do build.
- Candidatos 301 existentes, **ainda sem comprovação HTTP real**.
- URL histórica conhecida sem candidato 301.
- URL não canônica que falta no manifesto histórico.
- Subdomínio com escopo a ser revisado.

Os candidatos que exigem revisão são priorizados por **impressões, depois cliques**, com índice da linha original (máximo 25 entradas) e código fixo de motivo. Os totais para cada categoria permitem dimensionar o risco sem publicar URL, pesquisa, conteúdo, host, lead ou dado de cliente.

## Privacidade e segurança

- Uma única URL com query ou fragmento privado aciona a política F131: **todas as métricas e prioridades são suprimidas**; não apenas o registro suspeito.
- Páginas adicionais do GSC (`hasMore=true`) tornam o relatório explicitamente incompleto.
- O resultado jamais indica que a propriedade, o tenant, o OAuth ou os 301 foram verificados em produção.
- Se houver páginas sem mapeamento, inventário de redirects bloqueado, conteúdo privado ou paginação restante, o CLI termina com código de revisão pendente.
- Testes adversariais cobrem URLs privadas, domínio não correspondente, autorização forjada, limites de dados, ausência de mapeamento, priorização e privacidade do CLI.

## Aplicação na Imagine

Os sinais reais do domínio obtidos pelo OpenSEO indicam histórico HTTP/www e caminhos `/en-us/`. Essas observações não autorizam transferir a conexão OAuth do OpenSEO ao SaaS Imagine. O operador autorizado deverá gerar a exportação PAGE e o manifesto privado no ambiente permitido, revisar as prioridades e homologar 301/canonical/hreflang na Leaseweb antes de alterar DNS.

**O resultado é uma fila de trabalho, não um plano automático de redirecionamento.** Não há chamada ao Google ou à VPS nesta entrega. Continua obrigatório obter revisão editorial de equivalência página a página, GSC por tenant no backend, AppSec/LGPD, backup, rollback e decisão humana.
