# Imagine SEO RC52 — migração em staging com build SHA e revisão integrada

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [RC51 #204](https://github.com/rafhael100/imagine-seo-engine/pull/204), F140 [#206](https://github.com/rafhael100/imagine-seo-engine/pull/206) e F141 [#207](https://github.com/rafhael100/imagine-seo-engine/pull/207).

## Estado funcional

As verificações operacionais em laboratório foram agrupadas em uma linha de revisão. O fluxo F141:

1. Valida **offline** dados GSC fornecidos e plano legado 301 sem publicar URLs;
2. Confere **offline** o HTML compilado (canonical, sitemap, rotas, privacidade);
3. Calcula SHA-256 determinístico sobre todos os arquivos estáticos;
4. Compara com header do proxy HTTP de **loopback controlado** `X-Imagine-SEO-Build-SHA256`, bloqueando cabeçalho ausente ou divergente;
5. Se a versão corresponder, executa HEAD de URLs legadas e destinos aprovados **apenas em 127.0.0.1**, sem seguir Location remoto;
6. Recalcula o SHA depois da auditoria para impedir aceite com build modificado durante a execução.

O comando `scripts/run-attested-local-staging-qa.mjs` recebe manifesto 301, export GSC por página, diretório de build e porta explicitamente autorizada. O documento privado de capturas permanece fora do checkout e só é criado com `0600`; o console fornece apenas contagens e códigos de bloqueio.

## Resultados já verificados

- RC51: **22/22 workflows SUCCESS** na HEAD `36855451d8cc97f2f23f4348d761e8c1af11262a`.
- F140: teste de fingerprint e servidor de HEAD loopback real e suíte geral, Node 22/24, **SUCCESS** na SHA `35ba2111cb7a129f09d447c5ae825a9da85f4cd3`.
- F141: gate integrado, diretório compilado e servidor de loopback reais em CI, Node 22/24, **SUCCESS** na SHA `7f34b0fc7fa1bb0feee48f8da1a5fbae8676a17a`.
- A nova RC52 exige **CI novamente na própria HEAD** e inventário completo paginado antes de revisão de merge.

## Operação (staging somente, nenhuma alteração automática)

```bash
# Com o site estático compilado e o proxy local isolado configurado:
node scripts/fingerprint-compiled-site-offline.mjs /AREA-PRIVADA/build

# Insira o SHA-256 calculado no header de resposta do proxy local,
# confirme porta exclusiva (a abaixo é só exemplo) e execute:
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-attested-local-staging-qa.mjs \
  --gsc /AREA-PRIVADA/gsc-pages.json \
  --manifest /AREA-PRIVADA/legacy-plan.json \
  --build /AREA-PRIVADA/build \
  --out /AREA-PRIVADA/http-receipts.json \
  --port 18290 --enable-loopback-probe
```

Códigos: `0` apenas **revisão humana de staging**; `2` bloqueio; `1` falha/insegurança de IO/rede. Nenhum é autorização de publicar. Os exemplos e os testes usam dados sintéticos e domínio reservado.

## Dependências que não podem ser simuladas como aprovação real

- **Infra**: inventário da Leaseweb, identidade de serviço, Docker Compose isolado, recursos, backup/restore e rollback, portas exclusivas (não afetar CRM/Sites/Portal).
- **Google**: GSC conectado ao OpenSEO não concede automaticamente OAuth ao Portal; validar propriedade, consentimento, tenant, MFA, escopo readonly e revogação.
- **SEO**: dados oficiais IBGE e conteúdo local útil e original, ligações PT/EN/ES, qualidade editorial e redirects coerentes com intenção de busca.
- **HTTP público**: proxy HTTP local com Host + X-Forwarded-Proto não verifica DNS, certificado HTTPS/SNI, comportamento do Cloudflare, origem pública, cabeçalhos e status reais. Captura externa exige ambiente e autorização específicos.
- **Governança**: revisão independente AppSec/DBA/LGPD/SEO do diff histórico antes de merge. Não aplicar migrations, deploy, DNS, cobrança ou publicação por resultado de laboratório.

**NO-GO permanece** até os gates externos. Esta PR não acessa a VPS, não cria conta, não faz deploy nem modifica `main`.
