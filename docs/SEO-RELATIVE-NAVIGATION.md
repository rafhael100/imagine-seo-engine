# SEO — resolução de navegação relativa à página

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Defeito reproduzido

Na base `0eae548cf474c2932c66a933fa88e7d8b1ebc7d4`, o auditor resolvia
todos os links internos contra a raiz da origem. Uma página `/servicos/`
com `<a href="contato/">` deve apontar para `/servicos/contato/`, mas o
auditor procurava `/contato/`.

A reprodução local continha três páginas: `/`, `/servicos/` e `/contato/`.
O link relativo da página de serviços apontava para uma página ausente,
mas o relatório devolvia **zero erros e zero avisos**. Um servidor HTTP
real em loopback confirmou **404** para `/servicos/contato/` e **200** para
`/contato/`. O grafo de navegação também considerava o destino incorreto
alcançável, ocultando sua condição de página órfã.

## Correção

`normalizeUrl` recebe uma base de resolução opcional. Somente as âncoras de
navegação passam a fornecer a URL da página de origem, derivada de sua rota
compilada e da origem configurada. A comparação de origem continua usando
o site de referência, não o valor de um link fornecido pelo HTML.

Assim, caminhos relativos simples, `./`, `../` e páginas terminadas em
`.html` seguem o diretório correto. Links iniciados por `/` e URLs absolutas
mantêm seu comportamento. Fragmentos locais continuam sob a verificação
existente; fragmentos de outra página são usados apenas para identificar a
rota de destino, sem alegar nova validação de âncoras entre páginas.

Canonical, hreflang e sitemap preservam suas chamadas e contratos de
validação. Nenhuma regra de autorização, publicação ou acesso externo muda.

## BASE href exige revisão explícita

O auditor não simula `document.baseURI`. A presença de um BASE com href
ativo, inclusive no BODY, gera `unsupported_base_href`; não se aprova a
navegação usando silenciosamente uma base diferente. Href vazio, duplicado
ou atributos malformados também exigem revisão. O valor do href não aparece
no diagnóstico. O resumo encaminha o erro para `review_page_metadata`,
prioridade `high`.

A detecção reaproveita o scanner lexical no documento inteiro já filtrado.
Comentários, templates, raw text/RCDATA e texto em atributos não criam um
BASE ativo. Um BASE válido somente com `target`, sem href, permanece aceito.
Portanto, a resolução relativa à página descrita acima cobre documentos sem
BASE href; a presença desse recurso continua sendo uma limitação explícita.

## Validação

Os **27 testes novos**, executados em worktree descartável da base exata,
reproduziram **15 falhas esperadas e 12 controles aprovados**. Após a mudança,
**27/27 passaram** em Node 24.22.1. A regressão direcionada passou
**213/213**, e a suíte cumulativa `npm test` passou **1.015/1.015**, sem falhas,
cancelamentos ou testes ignorados.

Os casos cobrem o destino ausente oculto pela raiz, destino aninhado válido,
caminho com `./`, subida por `../`, páginas `.html`, fragmentos locais e em
destino aninhado, grafos/páginas órfãs, links root-relative, URLs absolutas e
origens externas. Os dados são sintéticos e temporários, sem chamadas a
sites de clientes ou a buscadores. Há ainda controles de BASE no HEAD/BODY,
casos vazios/ambíguos, conteúdo inerte, target-only e resumo sanitizado.

## Limites

O auditor continua inspecionando arquivos estáticos locais. Não prova o
comportamento de redirecionamentos HTTP, JavaScript de navegação ou sites
publicados. A homologação de produção e a aprovação humana permanecem
separadas do resultado desta biblioteca.
