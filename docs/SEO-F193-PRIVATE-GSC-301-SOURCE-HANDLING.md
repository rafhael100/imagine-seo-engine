# SEO F193 — impedir manifestos 301 derivados de GSC incompleto ou gravados no Git

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Vulnerabilidades de operação corrigidas

**1. Paginação incompleta.** Antes da F193, o gerador F185 classificava `hasMore=true` como inventário incompleto, mas ainda podia retornar e **gravar um manifesto 301 parcial**, contendo apenas as URLs visíveis naquela página do Google Search Console. Um arquivo dessa natureza poderia ser confundido posteriormente com um conjunto completo de URLs a migrar. A F186 já recusava essa condição; a F185 agora também **retorna `privateManifest=null`, sem contagens de propostas nem criação de arquivo** quando o GSC PAGE indica paginação restante.

**2. Arquivos privados no controle de versão.** O CLI F185 criava um arquivo `0600` numa pasta `0700`, mas não impedia que ela estivesse **dentro de outro checkout Git**. A F193 verifica toda a cadeia de ancestrais do diretório e recusa qualquer `.git` (diretório ou arquivo de worktree/submódulo), tanto na origem quanto no destino. Também recusa caminhos de saída não absolutos, parentes simbólicos, diretórios sem posse/permissão exclusiva e arquivos de origem legíveis por outros usuários.

O programa mantém o arquivo de manifesto `0600` e criação exclusiva, sem sobrescrever evidências anteriores, sem revelar URLs ou arquivos na saída. O build Astro também não pode ser um diretório fornecido por symlink. Todos os erros são sanitizados.

## Provas técnicas

A CI F185 em **Node 22 e Node 24** executa novos testes com arquivos reais de um diretório privado descartável: saída permitida somente fora do Git, recusa de exportação paginada, recusa de repositório e worktree privados, fonte `0644`, pasta `0755`, link simbólico de origem e de build, além de sobrescrita. O fixture F144 produz arquivos HTML estáticos e GSC de **laboratório**, sem informações de cliente.

A CI geral do Engine deve continuar validando F185/F186/F187 e o uso do manifesto somente para revisão. F167 constrói o Astro Comercial real F336, e a regra nova não pode quebrar seu diretório efêmero externo ao Git.

## Limites e próximo gate

A F193 **não** transforma dados do OpenSEO em OAuth da Imagine, não usa dados reais GSC, não comprova redirects na Leaseweb nem aprova equivalência editorial. Continuam exigidos grant de propriedade e consentimento por tenant no Portal/Engine, cofre de credenciais, revisão AppSec/LGPD, provas TLS/HTTP 301/canonical/hreflang, backup/restauração/rollback e decisão humana de publicação.

O resultado continua `HOLD` mesmo quando há um manifesto privado admissível. Esta entrega corrige riscos concretos sem acrescentar regras de produção.
