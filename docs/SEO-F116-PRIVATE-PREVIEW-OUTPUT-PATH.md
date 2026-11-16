# SEO F116 — impedir gravação de prévias privadas em pasta publicável

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F115 #163](https://github.com/rafhael100/imagine-seo-engine/pull/163).

## Falha evitada

A F112 gera prévias HTML que contêm conteúdo editorial não aprovado e nomes de municípios. Embora as prévias sejam marcadas como `noindex`, o destino de gravação era escolhido pelo operador sem validação de localização. Um engano como `./public/review/` ou `./dist/private/` poderia levar o conteúdo a um build público antes da detecção F113.

## Correção

A F116 introduz `requirePrivateEditorialPreviewDestination()` antes de gerar qualquer arquivo. O comando original de prévias:

- Recusa destinos que incluam segmentos de publicação, como `public`, `dist`, `build`, `out`, `www`, `htdocs`, `_site`, `static`, `.next`, `.vercel` e `uploads`.
- Recusa qualquer diretório sob árvore que contenha um controle `.git`: os arquivos privados não devem virar artefatos do checkout.
- Recusa ancestrais simbólicos e caminho pai que não exista ou que seja arquivo.
- Mantém exigência de criar pasta nova (sem sobrescrever), não recursiva, com permissão 0700 em Unix, arquivos 0600 e sem HTML de candidatos bloqueados.
- Retorna erro genérico sem revelar nomes de diretório ou conteúdo privado.

Exemplo usando uma pasta privada existente **fora do projeto Git**:

```bash
mkdir -m 700 "$HOME/private-seo-reviews"
node scripts/render-geo-editorial-previews-offline.mjs \
  drafts.json inventory.json reference.json \
  "$HOME/private-seo-reviews/review-001"
```

O último diretório precisa não existir antes do comando.

## Evidências

A suíte `npm test` executa testes de autorização de caminho e CLI: pasta publicável, checkout Git, diretório-pai com symlink, arquivos ou pais ausentes, URL inserida como caminho, entradas malformadas e saída válida em pasta temporária privada.

## Limitações

É defesa adicional, não isolamento definitivo. Não detecta todos os nomes de diretório usados por todos os servidores; não elimina condições de corrida no filesystem entre a checagem e a criação. O repositório deve ser operado em workspace privado confiável. A segurança de um deploy ainda requer F113/F115, revisão de build, permissões de servidor, AppSec, LGPD e processos de publicação supervisionados.

Sem acesso a VPS, CDN, GitHub main, páginas públicas ou dados de cliente.
