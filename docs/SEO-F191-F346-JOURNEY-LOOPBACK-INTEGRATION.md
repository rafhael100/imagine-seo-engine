# SEO F191 — unir Comercial F346 real aos gates HTTP HEAD da RC71

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Origem e estratégia de integração

A [RC71 #283](https://github.com/rafhael100/imagine-seo-engine/pull/283) reúne F185/F186, a F187 do laboratório HEAD 127.0.0.1, a auditoria cumulativa F188 e a proteção privada Nginx F189, com 62/62 workflows de origem aprovados. A [F190 #285](https://github.com/rafhael100/imagine-seo-engine/pull/285) passou em 2/2 workflows, incluindo **comparação real F336→F344 e Chromium F344**.

Em paralelo, a [PR #284](https://github.com/rafhael100/imagine-seo-engine/pull/284) criou um revisor especializado para o **Comercial F346** e passou em 2/2 workflows, mas sua branch se baseia diretamente na F186. Substituir cegamente o workflow F186 pela versão paralela removeria o teste F187 que usa **respostas HTTP realmente obtidas em loopback**.

## Preservação aditiva feita na F191

- Integra os arquivos da PR #284 `src/pinned-commercial-f346-static-journey.mjs` e `tests/pinned-commercial-f346-static-journey.test.mjs`, sem alterá-los nem refazer as validações.
- Atualiza o workflow de integração F186 para o **commit Comercial F346 imutável** `9c4b29c168ef0d53abfbf44e64c404fbcc8dc01a`.
- Exige HTML real compilado das três versões `/`, `/en/` e `/es/`, incluindo funil anônimo, resumo de investimento, link de navegação local `#simular-compra` e botão de cópia oculto sem JavaScript.
- Executa em seguida F186 (PAGE GSC original sintético + recibos HTTP sintéticos + HTML Astro real), **e continua executando o F187 de HEADs HTTP realmente capturados em 127.0.0.1**, com cinco cenários de sucesso/falha sobre **a mesma build F346**.
- Não duplica `npm ci` ou a compilação Astro: o CI reaproveita o mesmo checkout na execução das duas provas.

## Verificação e limites

Exigir CI Node e workflow F186 na HEAD exata da F191. A integração não substitui os testes nativos Chromium F346 — o teste Playwright F344 da F190 é uma evidência separada, não pode ser apresentado como prova de navegador F346. A conexão OAuth GSC real, grants multiempresa, redirects HTTP/TLS reais na Leaseweb, originalidade editorial, LGPD, backups e rollback continuam pendentes.

Não declarar site F346 pronto para produção por uma prova estática de HTML ou HTTP em servidor de laboratório. Nenhum merge, cliente, DNS, cobrança, Google OAuth ou deploy é efetuado.
