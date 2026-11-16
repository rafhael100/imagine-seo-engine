# SEO F189 — privacidade efetiva do mapa Nginx de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Vulnerabilidade corrigida

O gerador F145 cria um arquivo Nginx com mapas de redirecionamento contendo URLs e caminhos antigos do domínio. Ele precisa gravar esse arquivo com modo **0644**, pois o Nginx é executado em container como usuário não privilegiado (`uid 101`) e lê o arquivo por bind mount. A implementação anterior verificava que o caminho de saída estava fora do Git, **mas não exigia que a pasta do host fosse privada**. Um operador poderia gravar um mapa `0644` dentro de uma pasta `0755` de acesso público a outros usuários da VPS.

## Novo contrato de custódia

- Diretório que contém o **manifesto original** e diretório que receberá a **configuração Nginx** devem ser pastas ordinárias de posse do operador, com permissão **0700** em Linux/POSIX.
- O manifesto original deve ser arquivo regular privado **0600**, sem symlink; o descriptor aberto deve corresponder ao inode/dispositivo verificados antes de ler.
- A configuração final permanece **0644**, mas a pasta pai não pode ser atravessada por usuários diferentes do operador. Não é permitido escrever em diretório compartilhado, symlink ou dentro do checkout Git.
- O fixture F144 também usa diretório pai **0700** por padrão. A pasta do build HTML público e o arquivo Nginx podem ser montados separadamente no container sem divulgar o inventário privado na máquina host.
- Saídas de erro continuam genéricas; nenhuma URL, nome de arquivo, conteúdo de manifesto, IP de VPS ou segredo é revelado.

## Testes de regressão F189

Os testes verificam sucesso sob pasta `0700` e arquivo de origem `0600`, e recusam explicitamente:
1. pasta pai `0755` para manifesto ou saída;
2. manifesto `0644` mesmo em pasta privada;
3. pasta de saída compartilhada;
4. diretórios de saída simbólicos.

A alteração foi feita **sem reduzir os controles de F127/F128/F145** (mapa de 301 autorizado, HTML Astro auditado, fingerprint SHA do build) e sem disparar Nginx, Docker ou VPS fora dos testes descartáveis.

## Aplicação no staging real

Antes de executar F145 ou F149 na Leaseweb, o operador autorizado deve utilizar pasta exclusiva do usuário técnico, com dono/grupo verificados e permissão `0700`. Esta segurança de arquivos não substitui inventário de portas, firewall, TLS, backup, restauração, rollback ou autenticação OAuth GSC por tenant.

**Resultado: HOLD — revisão independente AppSec e homologação Leaseweb continuam obrigatórias.**
