# SEO F112 — prévias HTML privadas para aprovação editorial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continuação de [F111 #158](https://github.com/rafhael100/imagine-seo-engine/pull/158).

## Entrega

Até aqui o Imagine SEO Engine classificava o conteúdo municipal
sem gerar uma visualização útil ao editor. A F112 monta **arquivos
HTML locais** apenas para os rascunhos que passaram na triagem
técnica F107/F108/F109/F110. O texto é exatamente o fornecido
pelo operador; a ferramenta não produz conteúdo publicitário por IA.

A prévia utiliza o laranja Imagine #F9941D, cabeçalho simples,
título da página, corpo editorial e justificativa declarada.

Toda prévia contém:
- RASCUNHO INTERNO — NÃO PUBLICAR NEM INDEXAR
- meta robots noindex,nofollow,noarchive
- CSP que proíbe recursos de rede, scripts, formulários e base URLs
- texto escapado contra injeção de HTML/JS
- ausência de canonical, sitemap, rotas, links e formulários

A saída HTML contém texto editorial e município para revisão, portanto
**não deve ser publicada em um servidor público nem armazenada em
diretório de deploy**.

## Comando

Após preparar os três arquivos F110:

    mkdir -m 700 "$HOME/private-seo-reviews"
    node scripts/render-geo-editorial-previews-offline.mjs drafts.json inventory.json reference.json "$HOME/private-seo-reviews/review-001"

**F116:** a pasta pai precisa existir fora de qualquer checkout Git e fora de diretórios públicos (por exemplo `public`, `dist`, `build`, `www`, `htdocs`, `_site`). Pastas-pai simbólicas também são recusadas. A regra não protege contra um invasor local que altere os diretórios entre a validação e a criação; utilizar uma área privada confiável.

O diretório de saída precisa **não existir**. O programa cria
somente os arquivos draft-001.html, draft-002.html etc. para os
rascunhos que passaram na triagem. Identificadores são ordinais,
sem gerar slug público ou URL.

O diretório é criado com permissão privada (0700 quando suportado),
arquivos HTML com 0600 e criação exclusiva. Falha se o destino
já existir. O console só indica quantidades e impedimentos gerais,
nunca nomes, textos privados ou URLs.

Se todos estiverem bloqueados, nenhum HTML é criado.

## Limites de publicação

A marcação noindex **não transforma um arquivo hospedado em seguro
para publicação**. Estas prévias são apenas locais. Não existe
aprovação editorial formal, consentimento real, verificação da
referência municipal como proveniente do IBGE, controle de duplicações
de todo o site ou autorização de indexação.

Futuramente, qualquer publicação exige revisão de conteúdo
genuinamente local, disponibilidade comprovada do serviço, SEO
técnico, LGPD, controle de mudanças, testes de staging e rollback.

## Testes

    npm test

Cobrem HTML estático sem links/scripts/forms, escaping de payload
malicioso, não geração de rascunhos bloqueados, saída privada,
diretório de criação exclusiva e permissões de arquivo.

**Não modifica o site comercial, GitHub main, VPS, DNS nem
qualquer página ou sitemap publicado.**
