# SEO F197 — Imagine Comercial F348 real servido em Nginx Docker isolado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Qual lacuna foi fechada

As versões anteriores validavam separadamente:
- F150: Nginx Docker/Compose **real**, mas com páginas HTML e URLs `example.test` sintéticas.
- F187/F195: Astro Comercial compilado **real**, porém respostas HTTP 301 emitidas por um servidor Node `127.0.0.1` sintético.
- F195: Chromium do Comercial **F348** real, sem prova de que o Nginx criado pelo Compose F149 servia efetivamente os bytes dessa revisão.

O F197 conecta essas três camadas **na mesma execução**, com o mesmo build real F348 e os contratos F127/F128/F143/F145/F147/F149/F151 já existentes, sem substituir as provas anteriores.

## Execução em CI descartável

O workflow `.github/workflows/seo-f197-real-f348-nginx-compose-ci.yml` em Node 22 e 24:
1. Faz checkout somente leitura do Comercial F348 em **SHA imutável** `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`, verifica `git rev-parse HEAD`, roda `npm ci`, `astro build` e `check:dist`.
2. No runner CI autorizado (variáveis `CI=true`, `GITHUB_ACTIONS=true`, `APP_ENV=testing`, `SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK` e `SEO_F197_REAL_COMERCIAL_LAB=YES_SYNTHETIC_GSC_ONLY`), constrói um inventário **inteiramente sintético**, sem dados de cliente, SSH ou Docker host real da Leaseweb.
3. Gera mapa 301 conservador usando duas URLs **sintéticas** HTTP/www e HTTPS/www de caminho **idêntico** ao destino F348 realmente compilado. Não inventa mapeamento semântico `/en-us/` e não cria regra pública. Destinos auditados: `/`, `/en/`, `/es/`.
4. Renderiza a configuração privada F145 do Nginx com SHA256 dos arquivos do build, grava-a `0644` sob pasta `0700` e cria Compose F149 privado `0600`, com imagem `nginx:1.29.5-alpine` **fixada por digest**, usuário 101, rootfs somente leitura, sem capabilities, recursos limitados, bind mounts apenas de leitura e porta exclusiva em `127.0.0.1`.
5. Inicializa **o próprio container Nginx**, lê seu estado real de `docker inspect` pelo auditor F151 e confere imagem, UID, runtime saudável, limites, mounts, rede e única porta loopback.
6. Executa F143 com **duas respostas HTTP HEAD reais 301** e **três respostas GET HTML reais**, checando integridade byte a byte do HTML F348 PT/EN/ES e o SHA256 apresentado pelo proxy. O resultado é sanitizado, sem URLs, IP/porta, Docker IDs, headers ou arquivos privados.
7. Desliga o Compose, remove volumes e descarta a pasta temporária, mesmo em erro. O build original e repositórios continuam imutáveis.

## Critérios de HOLD

Mesmo com 301, GET e Docker reais, **a fonte GSC é sintética e a rede é apenas 127.0.0.1 no runner**, não a VPS Leaseweb. O resultado expõe explicitamente:
`gscPageSourceAuthenticated=false`, `oauthTenantVerified=false`, `tlsOrLeasewebVerified=false`, `publicReleaseAuthorized=false`, `deploymentAuthorized=false`.

Nenhum passo ativa Google OAuth, consulta Search Console de cliente, chama Cloudflare, troca DNS, publica páginas, instala containers na Leaseweb ou muda `main`. O próximo gate operacional permanece autorização de tenant/consentimento real, AppSec/LGPD, staging HTTPS seguro, teste de backup/restauração e rollback, revisão humana e GO formal.

A base desta implementação é a [RC74 #295](https://github.com/rafhael100/imagine-seo-engine/pull/295), validada **65/65 workflows**.
