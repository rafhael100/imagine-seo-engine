# SEO F203 — prazo absoluto de HEAD e HTML

## Problema reproduzido

A F202 aplicou prazo absoluto apenas ao GET de robots/sitemap. Os transportes F138 (HEAD de 301), F140 (HEAD de identidade do build) e F142 (GET do HTML) ainda usavam somente `request.setTimeout`, que acompanha inatividade do socket. Progresso contínuo podia ultrapassar `timeoutMs` e ainda gerar sucesso.

## Correção

Os três transportes passam `AbortSignal.timeout(timeoutMs)` à requisição, preservando o limite por inatividade, destinos exclusivamente `127.0.0.1`, ausência de redirecionamento automático, limites de bytes e erros sanitizados. O orçamento é por requisição; não é um prazo total do lote nem uma garantia de tempo real do processo.

## Evidência

`tests/loopback-absolute-deadlines.test.mjs` usa sockets reais restritos ao loopback. Dois servidores completam cabeçalhos válidos lentamente; o terceiro entrega exatamente o HTML local, mas após o limite. Os testes exigem rejeição e ausência da próxima conexão/rota. O digest F140 é calculado dos próprios arquivos sintéticos. Timers e sockets são limpos também no caminho de falha.

A primeira revisão contém somente os testes para observar a falha antes da correção: SHA `516b4b41044615c2148cd55ec3447865a3b69af3`, [execução de regressão](https://github.com/rafhael100/imagine-seo-engine/actions/runs/44180923165). Os resultados finais de Node 22/24 e do Nginx real F197 ficam vinculados à HEAD da [PR #305](https://github.com/rafhael100/imagine-seo-engine/pull/305). O workflow F197 agora também reage a alterações nesses três transportes.

Referências: [request.setTimeout](https://nodejs.org/api/http.html#requestsettimeouttimeout-callback) e [AbortSignal.timeout](https://nodejs.org/api/globals.html#static-method-abortsignaltimeoutdelay).

## Limites operacionais

Dados e domínio de exemplo sintéticos; não comprova OAuth/GSC por empresa, identidade/TLS de staging ou operação Leaseweb. DRAFT / NO-GO / NO-MERGE / NO-DEPLOY. Sem VPS, DNS, publicação, indexação ou custos externos.
