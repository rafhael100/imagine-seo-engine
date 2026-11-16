# SEO F194 — custódia de inventário Docker, manifesto 301 e Compose privado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Lacuna operacional identificada

A F189 passou a exigir diretório host `0700` para o mapa Nginx privado `0644`. O renderer de Compose F149, porém, ainda aceitava **inventário privado de containers e portas** e manifesto de URLs históricas sem conferir `0600`, o proprietário ou a privacidade da pasta. Seu CLI podia gravar a configuração Compose `0600` fora do checkout atual, mas **dentro de outro checkout Git**, com risco de commit acidental.

Esses arquivos podem revelar topologia, portas, nomes de serviços e URLs históricas. São dados operacionais, mesmo quando não incluem senhas.

## Correção F194

- `scripts/render-private-staging-compose.mjs` exige caminhos de entrada e saída **absolutos e canônicos**, pasta real de propriedade do operador com modo `0700`, sem links simbólicos intermediários, e fonte `0600`, de mesmo inode/dispositivo no momento da leitura.
- A fonte e o arquivo final são recusados se estiverem **dentro de qualquer árvore Git**, incluindo worktrees e submódulos (`.git` arquivo ou diretório nos ancestrais).
- `renderPrivateStagingCompose`, usado também pelas CIs F149/F150, recusa configuração Nginx que tenha pai acessível por outros usuários, symlink ou escrita por grupo/outros. A configuração `0644` continua legível por uid 101 **somente em diretório privado**.
- O output Compose mantém criação exclusiva `0600`; não há shell, deploy, Docker remoto, upload ou publicação no CLI F149.

## Verificação técnica

A CI F149 executa casos de diretórios `0755`, fonte `0644`, output dentro de Git, conf Nginx `0644` sob pasta pública e symlinks. A CI **F150 com Nginx real em Docker e Node 22/24** foi ligada aos novos arquivos F149, para comprovar que a proteção adicional não rompe o runtime isolado, bind mounts somente leitura, UID 101 ou testes de redirecionamento e rollback em ambiente descartável.

## Limitações

As verificações de segurança de arquivos não provam a identidade do operador, a autenticidade do inventário Docker real da Leaseweb, o escopo OAuth GSC por tenant, o firewall/TLS público nem restauração de backup e rollback operacional. Antes de qualquer VPS ou produção, exigem-se cofre de segredos, validação independente AppSec/LGPD, autorização de propriedade e GO humano.

O desenvolvimento permanece em GitHub, **sem merge e sem custos ou mudanças de DNS/deploy**.
