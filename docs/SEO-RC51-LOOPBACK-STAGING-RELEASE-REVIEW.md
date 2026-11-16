# Imagine SEO RC51 — HTTP de verdade em loopback sem afrouxar segurança

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuidade de [RC50 #199](https://github.com/rafhael100/imagine-seo-engine/pull/199), [F138 #201](https://github.com/rafhael100/imagine-seo-engine/pull/201) e [F139 #203](https://github.com/rafhael100/imagine-seo-engine/pull/203).

## Progresso funcional integrado

RC50 deixou os três controles de migração coesos: URLs legadas observadas no GSC em exportação privada (F133), recibos HTTP 301 fornecidos pelo operador (F134–F135) e destinos do novo HTML local compilado (F128), reunidos em F136–F137.

**F138** fechou uma lacuna adicional: execução de requisições HEAD HTTP reais em servidor de laboratório `127.0.0.1`, sem seguir `Location`, com limite de 100 candidatos e comparação por status 301, um hop, destino canônico absoluto e final 200.

**F139** expôs apenas ao operador a execução dessa prova por linha de comando, com manifesto privado de tamanho limitado, `SEO_F138_ALLOW_LOCAL_HEAD=1` explícito, retorno 0/1/2 e saída sanitizada.

### Integridade da política F77

A primeira iteração de F138 disparou a proteção **F77** porque utilizava `node:http` em `src/`. A arquitetura foi corrigida: o código de acesso local ficou exclusivamente em `labs/seo-f138-loopback/`, preservando a proibição de rede para **todo** `src/` e `scripts/`. Não foi alterada a política F77. A F138 final `1e149d6dc2e63b2a473755a89ee4e1af33c911fe` e F139 `1090b4887ab8b9aaf6862cecc8e940cfd6c6d898` passaram nos testes Node 22/24, incluindo a suíte integral.

## Operação segura de staging isolado

1. Auditoria da árvore completa RC51 e do estado `main` antes de qualquer merge, com revisão AppSec/DBA/LGPD/SEO independente.
2. Confirmar acesso autorizado e identidade do staging Leaseweb, recursos, backups, portas e volumes de todas as aplicações. Não tomar o loopback 127.0.0.1:18081 (historicamente ocupado pelo CRM).
3. Escolher uma porta local **comprovadamente livre e exclusiva**, e vincular o proxy sob loopback. Não expor essa porta para a Internet.
4. Gerar build imutável no staging; executar F125/F129 e a revisão integrada F137 com dados GSC privados + recibos fornecidos pelo operador.
5. Depois de confirmar que o proxy local é de staging, usar F139 para medir HTTP HEAD na porta selecionada; responder com relatório de contagens sem imprimir URLs privadas.
6. Obter provas **separadas** de certificado HTTPS e HTTP GET/HEAD do ambiente realmente autorizado; F139 não verifica TLS nem alcança DNS público.
7. Confirmar equivalência editorial de todas as URLs, canonical PT/EN/ES, hreflang/sitemap/robots, preservação de backlinks, controles contra doorway, IBGE oficial e dados reais GSC/GA4 autorizados por tenant.
8. Testar restore e rollback no staging isolado e registrar GO/NO-GO humano específico. Nunca ativar DNS, Cloudflare ou redirects de produção por retorno 0 de CLI.

## Situação após testes

O que está pronto: **contratos offline auditáveis, CI automatizada, instrumento local de HEAD e roteiro de operador**.

O que não existe nesta RC: identidade real de serviço no Portal, chaves de emissão KMS de produção, autorização Google por tenant, captura TLS verificada da VPS, publicação de conteúdo ou provas de rollback de produção.

**Status RC51: HOLD** até os gates operacionais acima. Não houve merge, deploy, escrita Google, cobrança nem alteração da VPS.
