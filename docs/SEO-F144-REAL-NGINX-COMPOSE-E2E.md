# SEO F144 — testar o fluxo completo em contêiner Nginx real, isolado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [F143 #210](https://github.com/rafhael100/imagine-seo-engine/pull/210). Esta entrega **não implanta** a Imagine na Leaseweb. Ela acrescenta um teste de CI em **Nginx de verdade** a partir de HTML e métricas totalmente sintéticos.

## Diferença em relação às etapas anteriores

F138–F143 usam um servidor HTTP Node em CI para testar as regras de validação. A F144 executa em Docker Compose um Nginx com configuração e arquivos estáticos reais, permitindo exercer as condições de um servidor de homologação mais próximas de produção.

A definição em `labs/seo-f144-nginx/docker-compose.yml` usa uma imagem oficial Nginx identificada por digest (não apenas tag), usuário sem privilégios `101:101`, sem capabilities extras, filesystem raiz somente leitura, `tmpfs` limitado, porta host dinâmica vinculada somente a `127.0.0.1`, rede própria interna e volumes com **montagem read-only**. Os testes usam SHA imutável da imagem verificada no Docker Hub:
`nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b`.

A escolha dessa imagem foi fixada para **reprodutibilidade de laboratório**; antes de produção, será obrigatório atualizar para versão com segurança revisada, inclusive CVEs e SBOM. A CI baixa a imagem pública do registry, mas não acessa os domínios da Imagine nem dados de clientes.

## Dois testes com Nginx real

1. **Build correto**: o gerador cria `index.html`, `en/index.html`, sitemap, robots, mapeamentos HTTP/www/en-us e páginas GSC sintéticas em `example.test`. O proxy Nginx informa o digest do build e implementa os 301. F143 deve retornar somente `human_independent_served_html_staging_review_required`; verifica 2 redirects e 2 respostas GET idênticas.
2. **Build servido incorretamente**: outro Nginx, com o **mesmo header SHA** e mesmo build montado, entrega o HTML português ao solicitar `/en/`. Os HEADs 301 e o header de versão podem estar corretos, mas a F142/F143 devem retornar `blocked` por divergência de conteúdo real. Isso prova que o gate não confia somente no header fornecido pelo proxy.

A CI limpa os contêineres e apaga a pasta temporária ao concluir ou falhar. Os paths de resultados GSC/capturas continuam privados e não são enviados como artefatos do GitHub.

## Como reproduzir sem tocar na VPS

O workflow `.github/workflows/seo-f144-nginx-compose-ci.yml` executa Node 22/24 em runners descartáveis, roda a suíte geral e chama:

```bash
CI=true GITHUB_ACTIONS=true APP_ENV=testing \
SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
F144_NODE=22 bash labs/seo-f144-nginx/run-compose-ci.sh
```

Esse comando é **destinado a um runner isolado**, não deve ser executado em host compartilhado sem revisão. Exige Docker Compose e acesso ao registry para baixar a imagem. Os ambientes do GitHub Actions não são evidência de configuração real de Nginx na VPS.

## Próximo bloqueio concreto

Para homologar o site real, ainda serão necessários: seleção de porta livre na VPS, Docker Compose de staging separado do CRM/Portal/Sites, artefato HTML real aprovado por SHA, proxy de staging configurado com as rotas Imagine, GSC/Google grants por tenant e consentimento, TLS/SNI de verdade, conteúdo original por serviço/cidade, backup/restore e rollback. O relatório de laboratório é `NO-GO` para publicação sem esses gates.

Nenhum merge automático, publicação DNS/Cloudflare, alteração da VPS ou cobrança é efetuado.
