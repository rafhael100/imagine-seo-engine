# SEO — revisão de expiração programada em meta robots

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Falha reproduzida

Uma página sintética com head público válido e a declaração adicional
`<meta name="googlebot" content="unavailable_after: 2000-01-01T00:00:00Z">`
recebia zero erros e zero avisos, inclusive com `strictPublicHead=true`.
O auditor reconhecia `noindex`, `none` e `nofollow`, mas não sinalizava a
restrição de visibilidade programada. A F207 já exige revisão da mesma
diretiva quando ela é recebida em `X-Robots-Tag`.

## Decisão e comportamento

As metas aplicáveis ao crawler geral, `robots` e `googlebot`, no HEAD ou no
BODY, passam a
produzir `meta_robots_policy_review_required` quando contêm a diretiva
`unavailable_after:`. Uma declaração permissiva separada não cancela o
agendamento. O diagnóstico preserva a distinção entre expiração programada
e bloqueio explícito por `noindex`.

Qualquer agenda exige revisão, incluindo data passada, futura, vazia ou
malformada. O auditor não interpreta formatos, fuso horário ou relógio atual
para aprovar uma data futura. Essa decisão é consistente com a política de
revisão da F207, sem reutilizar a semântica de escopo de agentes do cabeçalho
HTTP dentro do atributo `content` de uma meta.

O resumo executivo encaminha o achado para `review_indexation`, prioridade
`high`, e não expõe a data, o conteúdo da diretiva ou a rota do arquivo.
As restrições existentes de metadados, robots genérico estrito e aprovação
operacional continuam vigentes. Metas de outros crawlers não são
reinterpretadas como expiração da página.

A regressão também comprovou um falso positivo relacionado:
`max-image-preview: none` era dividido em palavras e seu valor `none`
acabava confundido com a diretiva autônoma `none`, equivalente a
`noindex,nofollow`. Agora os valores válidos `none`, `standard` e `large`
desse parâmetro são consumidos como parte dele. Diretivas autônomas antes ou
depois, como `max-image-preview: none, noindex`, continuam bloqueando.
Sintaxe desconhecida ou inválida conserva o caminho anterior; o recorte não
é apresentado como validação completa de parâmetros de buscadores.

## Verificação e limites

A regressão utiliza apenas arquivos locais sintéticos. Ela compara controles
saudáveis com datas passadas/futuras, formato RFC com vírgula, data vazia,
caixa mista, referências HTML decodificadas, metas repetidas e resumo
sanitizado. Comentários, templates, scripts e conteúdo textual de title
continuam inertes para essa checagem. A decodificação não é recursiva.

Na base `3af252f33c7ef365137853f60aef84b42228d8c6`, os 21 testes novos
produziram **11 falhas esperadas e 10 controles aprovados** antes da correção.
Após a alteração, **21/21 passaram** em Node 24.22.1. O ensaio inclui
`max-image-preview: none` com espaços, caixa mista e outros parâmetros, além
de diretivas restritivas independentes que não podem ser consumidas junto
com o parâmetro.

A regressão direcionada somou **205/205 testes aprovados**, incluindo os
novos casos, auditor geral, BODY robots, atributos do HEAD, limites de
documento, resumo executivo e cabeçalhos HTTP. A validação remota Node
22/24 deve ser conferida na SHA final da PR.

O recorte identifica a diretiva e exige revisão; não implementa um parser
completo de políticas de buscadores nem comprova o comportamento de um site
publicado. Não consulta Google, não altera HTML auditado e não executa OAuth,
publicação, DNS ou mudanças na VPS.

## Fonte primária

[Google Search Central — robots meta e X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag),
conferido em 17/11/2026: `unavailable_after` pode restringir a exibição de uma
página após a data especificada. A revisão obrigatória independentemente do
relógio é a política conservadora adotada pelo projeto.
