# SEO F141 — gate único GSC, HTML, fingerprint e 301 de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Evolui [F139 #202](https://github.com/rafhael100/imagine-seo-engine/pull/202) e [F140 #206](https://github.com/rafhael100/imagine-seo-engine/pull/206), preservando os contratos existentes.

## Ordem de segurança (fail-closed)

A F141 executa em sequência:

1. **Offline**: GSC original por página versus manifesto F127, bloqueando páginas sem destino, dados privados e paginação incompleta.
2. **Offline**: revisão F128 do HTML realmente compilado, das rotas presentes, sitemap/canonical/hreflang e prévias privadas. Se algum dos dois primeiros falhar, **nenhuma requisição local ocorre**.
3. **Hash**: fingerprint SHA-256 de cada arquivo no build, usando a F140.
4. **Loopback**: HEAD ao host canônico pelo proxy privado `127.0.0.1`; bloqueia ausência ou divergência de `X-Imagine-SEO-Build-SHA256` **antes de consultar qualquer URL 301**.
5. **Loopback**: se o hash corresponder, executa F139/F138 (HTTP 301 real local + GSC/HTML), cruzando as três fontes.
6. **Offline**: calcula novamente o digest do build depois dos testes. Se o conteúdo mudar durante a homologação, bloqueia a revisão.

Nenhum status `GO` de produção é retornado: apenas `blocked` ou `human_independent_attested_staging_review_required`.

## Comando em staging isolado

Primeiro configurar o proxy com o hash real calculado por:

```bash
node scripts/fingerprint-compiled-site-offline.mjs /AREA-PRIVADA/build
```

Depois rodar:

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-attested-local-staging-qa.mjs \
 --gsc /AREA-PRIVADA/gsc-pages.json \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --out /AREA-PRIVADA/http-receipts.json \
 --port 18290 --enable-loopback-probe
```

A porta é **ilustrativa** e só pode ser escolhida depois do inventário real de serviços Docker na Leaseweb. Não reutilizar a porta do CRM ou qualquer outro projeto. A saída no terminal contém apenas contagens e flags; os comprovantes contendo URLs continuam em arquivo privado `0600` fora da árvore Git, sem sobrescrita.

**Códigos de saída:** 0 = revisão humana de staging; 2 = bloqueio detectado; 1 = entrada insegura, erro de IO ou falha de rede local. Nenhuma falha provoca merge/deploy ou escrita em DNS/Nginx/Cloudflare.

## Fronteira de confiança

O header de SHA pode ser configurado incorretamente ou forjado por quem controla o proxy. A F141 comprova consistência de arquivos observada, **não** autenticação de TLS/SNI público, do servidor, da conta Google, da identidade do tenant, nem cadeia de fornecimento assinada. O Google Search Console permanece uma fonte privada fornecida pelo operador, não uma chamada OAuth da aplicação.

Gates pendentes: conteúdo territorial original/IBGE oficial, equivalência editorial de redirecionamentos, propriedade GSC verificada com grant por empresa, revisão AppSec/DBA/LGPD, backups/restore, rollback real, testes HTTPS autorizados e aprovação humana do deploy.
