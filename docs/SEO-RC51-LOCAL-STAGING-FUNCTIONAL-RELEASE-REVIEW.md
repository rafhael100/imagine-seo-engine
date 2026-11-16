# Imagine SEO RC51 — captura HTTP local e pré-homologação integrada

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolida a linha [RC50 #199](https://github.com/rafhael100/imagine-seo-engine/pull/199), [F138 #200](https://github.com/rafhael100/imagine-seo-engine/pull/200) e [F139 #202](https://github.com/rafhael100/imagine-seo-engine/pull/202), sem ativar nenhum serviço na VPS.

## Funcionalidade adicionada

**F138** executa HEADs reais apenas para `127.0.0.1` e porta explicitamente fornecida, usando `Host`/esquema lógico das URLs F127. Não segue Location remoto; testa o destino canônico aprovado também no loopback. Armazena comprovantes privados `0600`, fora da árvore Git, sem overwrite. Não executa curl público, OAuth, TLS/SNI ou escrita em Nginx. O módulo de rede reside em `labs/seo-f138-loopback/`, **não** em `src` nem `scripts`; a política offline F77 permanece intacta.

**F139** agrega GSC por página e inventário 301 F127, audita o HTML realmente compilado F128 e **só se ambos não apresentarem bloqueio** executa HTTP loopback F138. Fecha o diagnóstico através do gate cruzado F136. Erros GSC/HTML interrompem a operação antes de tocar a rede. Entrega saída sanitizada, recibos privados (quando houver captura) e códigos 0/1/2.

## CI de origem

- F138: suíte geral e teste loopback com servidor HTTP real local, Node 22/24 — **SUCCESS** na HEAD `376e0d6d8d55cf8b45be384ac50b62fee92b0c7c`.
- F139: suíte geral e teste integrado GSC + HTML + servidor loopback real, Node 22/24 — **SUCCESS** na HEAD `4052a6f8f184eb14068d90e275c8c6826b29db5d`.
- O histórico continua incluindo cobertura municipal multilíngue, hreflang, contratos Ed25519 v2, migração legada F127–F129, preparações GA4 e comparadores GSC/301. **Exige CI própria na nova HEAD RC51**.

## Execução privada (após criação autorizada do staging)

```bash
APP_ENV=staging SEO_F138_LOOPBACK_STAGING=YES_I_CONTROL_THIS_LOOPBACK \
node scripts/run-local-staging-migration-qa.mjs \
 --gsc /AREA-PRIVADA/gsc-pages.json \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/compiled-site \
 --out /AREA-PRIVADA/http-receipts.json \
 --port 18290 --enable-loopback-probe
```

**Porta ilustrativa**: inventariar e provar porta livre na Leaseweb; CRM usa historicamente `127.0.0.1:18081`. Nunca assumir compartilhamento de volumes/networks nem iniciar o proxy sem confirmar controle de recursos. Não copiar arquivos privados para PR público, console, chat ou CI.

O proxy HTTP local simula o esquema por `X-Forwarded-Proto`; isso não prova que o TLS, DNS, a propriedade Google ou os redirects públicos estejam corretos.

## Pendências para liberação real

1. Inventário paginado e revisão independente do diff acumulado antes de qualquer merge; sem confundir CI verde e prontidão de release.
2. IBGE verificado, conteúdo relevante por município, equivalência editorial das páginas legadas, PT/EN/ES e QA de hreflang/canonical.
3. Portal: OAuth GSC e grants reais de propriedade/tenant, MFA/consentimento, fonte confiável de assinatura, auditoria LGPD.
4. VPS: inventário dos contêineres, volumes, redes, portas, permissão de acesso, TLS, backup/restore/rollback; homologação isolada sem impacto no CRM/Sites/Portal.
5. Conferência HTTP/TLS pública autorizada separadamente (F138 **não** faz isso) e autorização humana específica para DNS/Nginx/Cloudflare/merge/publicação.

**Status: HOLD.** Esta RC50→RC51 não altera main, DNS, VPS, billing, dados reais nem publica conteúdo.
