# SEO F142 — comparar os bytes HTTP reais com os arquivos HTML do build

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC52 #208](https://github.com/rafhael100/imagine-seo-engine/pull/208).

## Por que não basta um header de SHA-256?

A F140 confere um header `X-Imagine-SEO-Build-SHA256` fornecido pelo proxy de staging. Um proxy configurado incorretamente pode anunciar o digest correto e, **ao mesmo tempo, servir HTML de outra versão**. F142 fecha essa lacuna **dentro do ambiente de laboratório** conferindo o corpo do GET que o proxy entrega por cada rota pública aprovada.

`reviewLoopbackServedHtmlParity({migrationInput,buildDirectory,stagingPort,timeoutMs})`:

1. Valida o manifesto F127, rejeita versão inadequada e limita a 80 `targetRoutes`.
2. Antes de qualquer rede, lê cada arquivo `index.html` esperado para as rotas e faz o SHA-256 do conteúdo. Aceita rotas `/foo/` → `foo/index.html`; para `/file.html`, usa o arquivo literal. `/foo` também procura `foo/index.html`. Links simbólicos, rotas inseguras, arquivo ausente e caminhos fora da raiz são recusados.
3. Impõe máximo de 2 MiB por HTML, 16 MiB somados, timeout local até 5 segundos, sem cookies/token/corpo de solicitação.
4. Faz HTTP **GET apenas a `127.0.0.1`**, porta explícita, `Host` canônico do manifesto, `X-Forwarded-Proto: https` lógico e `Accept-Encoding: identity`. Não resolve DNS público e não segue Location.
5. Exige HTTP 200, `Content-Type: text/html`, sem compressão, mesmo tamanho e **mesmo SHA-256 dos bytes efetivamente recebidos**. Se o HTML remoto for alterado mantendo o mesmo comprimento, ainda bloqueia.
6. Retorna somente contagens, flags de NO-GO e índices dos alvos, sem URLs, caminhos de servidor, conteúdo HTML nem hashes por página.

## Exigências antes de usar na VPS

A F142 não inicia Nginx/Traefik e não configura proxy. O servidor HTTP local deve corresponder ao mesmo build já auditado; arquivos dinâmicos que injetam HTML ou comprimem conteúdo precisam de plano de equivalência. Cabeçalho fixo não substitui o teste de bytes.

- Primeiro executar F141 (GSC, plano 301, header SHA e estabilidade do build), **depois** F142 para confrontar o conteúdo entregue; a integração no mesmo runner é uma etapa seguinte.
- Conferir porta livre, isolamento Docker e ausência de serviços de clientes no mesmo listener.
- Não enviar dados privados de GSC, cookies ou páginas de clientes ao GitHub.
- Não inferir validade TLS público, identidade de proxy ou indexação Google. Tudo permanece sob revisão AppSec/SEO e autorização humana.

A CI usa servidor HTTP real **apenas no loopback** com HTML fictício e testa igualdade, alteração do HTML com igual comprimento, 302 externo sem segui-lo, tipo/encoding inadequados, corpo acima do limite e symlinks. **Zero deploy, zero DNS, zero chamada à rede pública.**
