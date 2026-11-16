# SEO F200 — não consultar Docker se o inventário não puder ser salvo privadamente

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Risco identificado

A F148 fornece um coletor **somente leitura** de topologia do host local (`docker context inspect`, listagem de containers, redes, volumes e portas, e `ss -lnt`). Seu snapshot inclui nomes de serviços e metadados operacionais. Apesar de gravar arquivo `0600` fora do checkout atual, o programa aceitava destino dentro de **outro Git/worktree** ou em uma pasta `0755`, alcançável por outros usuários.

Além da exposição acidental, a ferramenta podia iniciar consultas ao daemon antes de perceber a má custódia da saída. Isso não é necessário e deve ser bloqueado **antes do primeiro comando Docker**.

## Correção F200

A F200 reutiliza o módulo privado F199, `reviewPrivateOperatorFilePath`, antes de executar o `docker context inspect`. O caminho de saída deve:
- ser absoluto/canônico, com diretório pai `0700`, proprietário operador e sem symlinks;
- estar fora de **qualquer checkout Git**, incluindo submódulos/worktrees onde `.git` pode ser arquivo ou diretório;
- continuar criado exclusivamente com `O_EXCL` e modo `0600`, sem sobrescrever arquivo anterior;
- nunca aparecer em stdout/stderr, nem vazar a topologia, nomes de serviços ou portas.

Os controles anteriores F148 permanecem: aprovação explícita `SEO_F148_LOCAL_INVENTORY=YES_READ_ONLY_DOCKER_HOST`, daemon **local Unix** sem conexão remota, comandos fixos somente de consulta, limite de bytes, classificação sanitizada do inventário e ausência de alterações no host.

## Evidências de CI

Os testes em Node 22/24 usam mocks locais de `docker` e `ss`, e instrumentam um arquivo-sentinela que é criado se qualquer consulta Docker ocorrer. Rejeições de pasta `0755`, destino sob outro Git/worktree e diretório simbólico devem **deixar a sentinela inexistente**, o output ausente e o erro genérico. O caso válido continua a gravar snapshot `0600` com topologia de laboratório.

A atualização **não inspeciona o Docker real da VPS Leaseweb** e não representa autenticação de host ou aprovação para iniciar containers. A captura e as etapas F147/F149/F150 continuam dependendo do operador autorizado e do inventário atual, com AppSec/LGPD, backup/restauração, rollback, isolamento e GO humano.

Segue a [F199 #299](https://github.com/rafhael100/imagine-seo-engine/pull/299) e a [RC75 #298](https://github.com/rafhael100/imagine-seo-engine/pull/298), sem mexer em `main`, VPS, DNS ou produção.
