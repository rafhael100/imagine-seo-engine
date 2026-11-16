# Imagine SEO RC63 — comparação entre releases e revisão editorial nacional

**CANDIDATA SOMENTE PARA REVISÃO — DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Origem preservada

Continua a [RC62 #248](https://github.com/rafhael100/imagine-seo-engine/pull/248), que passou 46/46 workflows na SHA `cba57dba08e388bfbe9a86861679f02dd4a8d6a4`, incluindo os gates de segurança, navegador e relatórios Portal.

Integra cumulativamente:
- [F167 #250](https://github.com/rafhael100/imagine-seo-engine/pull/250): comparadores offline da [F162 #244](https://github.com/rafhael100/imagine-seo-engine/pull/244) e [F166 #249](https://github.com/rafhael100/imagine-seo-engine/pull/249); testa dois builds Astro reais do Imagine Comercial com SHAs F335/F336 imutáveis e emite apenas resultados agregados de regressão/rotas. A F167 passou em seus dois workflows.
- [F168 #252](https://github.com/rafhael100/imagine-seo-engine/pull/252): bloqueio de cópia editorial por substituição de município entre até 6.000 entradas privadas, com diagnósticos limitados e sem conteúdo bruto. Testes Node 22/24 e validação geral da F168 aprovados.

## Candidata e prova

A RC63 exige **nova CI completa em sua própria HEAD**, sem reutilizar a aprovação das branches anteriores como se fosse aprovação desta revisão. Conferir o resultado de TODOS os workflows disparados; investigar falhas, mudanças de SHA e jobs não executados.

## Gates operacionais que continuam abertos

- Obter base oficial IBGE/DTB e registrar origem dos bytes e edição por evidência confiável independente; [issue #230](https://github.com/rafhael100/imagine-seo-engine/issues/230) continua OPEN.
- Submeter revisão independente de dados, segurança, LGPD, migração HTTP/WWW/EN-US e conteúdo editorial com valor local e atendimento confirmado.
- Conectar GSC de modo autorizado e isolado **no próprio Imagine SEO Engine por tenant**. A conexão existente no OpenSEO não concede automaticamente OAuth ao Engine.
- Validar a migração dos redirects em staging Leaseweb seguro e separado, executar backup/restauração e rollback reais e obter aceite formal de publicação.
- Não indexar indiscriminadamente municípios e não confundir 5.569 municípios jurídicos com 5.571 localidades estatísticas.
- Todas as evidências sintéticas e relatórios de CI continuam **indicadores de engenharia, não indicadores comerciais ou de ranking**.

Nenhuma alteração em `main`, DNS, VPS, GSC, cobrança, anúncios ou dados de clientes é realizada pelo fluxo RC63. O motor F162 mantém `publicationAuthorized=false` mesmo com todos os recibos declarados.

**Resultado de release: HOLD aguardando prova oficial, homologação real e revisão humana.**
