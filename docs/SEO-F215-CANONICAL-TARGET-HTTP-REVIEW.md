# SEO F215 — revisão HTTP de destinos canonical

Esta entrega conecta **duas observações independentes fornecidas pelo operador**:
uma declaração canonical em HTML HTTP 200 e o status GET exato da URL de destino.
Não consulta Google, Search Console, arquivos privados ou servidores externos.

A issue #325 registra duas variantes /en-us com canonical declarado para
um mesmo alvo cujo status observado em 18/11/2026 foi 302. Esse fato não
comprova a URL final, a cadeia de redirecionamentos nem equivalência editorial.

O revisor aceita apenas URLs HTTPS absolutas e sem query, fragment, credenciais
ou normalização silenciosa. Contabiliza declarações afetadas e alvos distintos,
identifica falta de canonical, status 3xx/4xx/5xx, destino off-origin e ausência
de observação independente, rejeitando documentos duplicados, getters e dados
malformados. Emite somente contagens e índices com códigos fixos: não reproduz
URLs de entrada, texto HTML, métricas GSC ou dados pessoais.

Mesmo com todos os alvos HTTP 200, o resultado é human_editorial_http_review_required.
O HTTP fornecido não é autenticado pela função; não há verificação de indexação,
paridade de conteúdo, autorização jurídica ou 301. releaseAuthorized=false e
redirectsAuthorized=0 permanecem imutáveis.

Contrato: imagine.seo.canonical-target-http-evidence.v1, com siteOrigin sem barra,
pageEvidence.sourceType=operator_supplied_public_html_metadata_unverified e
targetEvidence.sourceType=operator_supplied_independent_public_http_get_unverified.
Cada página tem pageUrl, pageStatus=200, canonicalHref (ou null); cada alvo
tem targetUrl e status. O acesso aos arquivos operacionais e a coleta real
continuam sob custódia privada, fora do Git.
