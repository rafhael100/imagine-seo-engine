# SEO F146 — ensaio de rollback da configuração Nginx de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua a RC54 [#214](https://github.com/rafhael100/imagine-seo-engine/pull/214) e o laboratório Docker F144/F145. O objetivo é provar **reversão controlada de configuração**, não backup integral ou recuperação do servidor Leaseweb.

## Ensaio automático com Nginx real

No runner descartável do GitHub Actions, o mesmo projeto Docker Compose isolado é submetido a três cenários:

1. **Configuração correta:** arquivo Nginx derivado do manifesto F127 pelo renderizador F145, HTML PT/EN compilado, SHA correto, redirects e GETs validados no F143. Resultado somente candidato a revisão humana.
2. **Configuração incorreta:** Nginx é recriado com configuração que anuncia o mesmo SHA mas serve conteúdo PT no caminho `/en/`. O gate F143 deve retornar **blocked** com divergência nos bytes do HTML real.
3. **Rollback:** o Nginx incorreto é removido sem tocar em outros projetos; a configuração original gerada é restaurada. O roteiro verifica o SHA-256 da configuração original, sobe o contêiner novamente e exige que todo o gate F143 volte a passar (2 destinos HTML e 2 redirecionamentos 301 corretos).

Cada execução usa porta efêmera em `127.0.0.1`, projeto próprio, filesystem read-only e volumes de entrada somente leitura. Os comprovantes contendo URLs originais ficam temporários, fora do checkout, e são apagados ao final. Nenhum log bruto, token, URL de cliente ou arquivo GSC real é exposto.

## Comandos de CI

```bash
CI=true GITHUB_ACTIONS=true APP_ENV=testing \
SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
F144_NODE=22 bash labs/seo-f144-nginx/run-compose-ci.sh
```

Essa ferramenta exige ambiente **descartável de CI** e a imagem oficial Nginx fixada por digest, não modifica o Docker Engine de produção e não faz deploy.

## O que ainda impede liberação real

Este ensaio **não** testa restauração de PostgreSQL, backup de volumes de clientes, rollback de DNS/Cloudflare, TLS/SNI público nem o provisionamento real na VPS Leaseweb. O Nginx usa dados sintéticos `example.test`.

Exigir posteriormente: inventário das portas e redes reais; snapshots seguros; rollback com monitoramento e sem interrupção de CRM/Portal/Sites; revisão AppSec de imagem, isolamento e headers; GSC autorizado por tenant; IBGE/conteúdo editorial e aprovação humana de publicação.

**Estado NO-GO:** a passagem do teste é evidência técnica de rollback da configuração de laboratório, não autorização para alterar a infraestrutura da Imagine.
