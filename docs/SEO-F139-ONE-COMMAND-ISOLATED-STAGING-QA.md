# SEO F139 — um único comando para pré-homologar migração no staging isolado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [F138 #200](https://github.com/rafhael100/imagine-seo-engine/pull/200) e as auditorias F127–F137.

## O fluxo integrado

A execução começa **sem rede**: primeiro valida export por página GSC (F131/F133) e inventário 301 F127; em seguida verifica o **HTML realmente compilado** (F128), sitemap, canonical e destinos.

Se a origem GSC, os mapeamentos ou o build estiverem bloqueados, a F139 **não faz nenhuma requisição HTTP**. Se forem candidatos a revisão humana, executa F138 contra o **loopback explícito e isolado** `127.0.0.1` e confere os recibos com F134, fechando com o gate cruzado F136. Nunca segue redirecionamento remoto nem resolve domínios externos.

## Uso supervisionado em Ubuntu staging

Preparar uma pasta privada fora da árvore do Git com arquivos `gsc-pages.json` (GSC original autorizado, por página) e `legacy-plan.json` (manifesto F127). Gerar o HTML em pasta privada e iniciar o proxy isolado em uma porta comprovadamente livre, **sem compartilhar contêiner/volume/rede com CRM, Sites ou Portal**. Registrar SHA do build e configuração do proxy.

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-local-staging-migration-qa.mjs \
  --gsc /AREA-PRIVADA/gsc-pages.json \
  --manifest /AREA-PRIVADA/legacy-plan.json \
  --build /AREA-PRIVADA/compiled-site \
  --out /AREA-PRIVADA/http-receipts.json \
  --port 18290 \
  --enable-loopback-probe
```

A porta é exemplo: **não** presumir que `18290` esteja livre. O comando não abre nenhum serviço nem altera a VPS. Recibo privado contém URLs originais, permissões `0600`, criação exclusiva (sem overwrite) e fora da árvore Git. Quando houver bloqueio antes do primeiro HEAD, o arquivo não será criado.

**Códigos:** `0` = somente candidato a revisão humana; `2` = pelo menos um gate bloqueado; `1` = falha/arquivo inseguro. Todos os diagnósticos no stdout são sanitizados, sem host, URL, GSC raw, tokens ou caminho local.

## CI e honestidade sobre a evidência

A CI executa um **servidor HTTP local real em `127.0.0.1`**, cria HTML real temporário, export GSC fictício, manifestos 301 fictícios e testa que:
- GSC e build coerentes permitem HEAD local e resultam em revisão humana, nunca publicação;
- URLs GSC com parâmetros privados, destinos compilados ausentes ou erro editorial impedem chamadas de rede;
- HTTP 302 observado bloqueia, mesmo com GSC/build coerentes;
- arquivos sensíveis ficam `0600`, sem overwrite nem dados reais no log.

O proxy de teste **simula** hosts por `Host` e esquemas por `X-Forwarded-Proto`; isso não valida TLS/SNI real, DNS público, redirects Cloudflare ou identidade da VPS. A captura GSC continua fornecida pelo operador, não autentica o Portal, seu tenant nem a permissão OAuth.

## Critérios finais de liberação

Gate humano independente de segurança, SEO/editorial e LGPD; propriedade GSC real verificada no Portal; IBGE oficial; qualidade territorial/conteúdo útil; HTTPS real autorizado com certificado/SNI; backups/restore/rollback; VPS isolada sem conflitos; consentimento e aprovação explícita de deploy. Nenhuma regra 301 de produção será publicada por esta ferramenta.
