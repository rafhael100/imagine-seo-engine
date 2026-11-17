# Imagine SEO RC68 — priorização GSC e integridade do cadastro/editorial

**CANDIDATA DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Escopo consolidado, preservando commits históricos

Esta candidata continua a [RC67 #270](https://github.com/rafhael100/imagine-seo-engine/pull/270), que concluiu **58/58 workflows** sobre a HEAD `f7a00a4c43b76ba6a9233bbe446e5a1dc656d1b0`. Mantém F159–F180, incluindo navegador real Chromium PT/EN/ES, revisão da edição IBGE DTB/Áreas 2025, filtro territorial, catálogo Comercial F336 e migração de URLs em builds Astro.

Novos recortes:

- [F183 #273](https://github.com/rafhael100/imagine-seo-engine/pull/273): revisa **linhas originais GSC PAGE** junto a F127/F131/F133 para gerar fila privada de prioridades de redirecionamento por impressões e cliques, sem exportar URLs ou consultas; bloqueia métricas inteiras em presença de query/hash privado; 2/2 workflows de origem aprovados.
- [F184 #274](https://github.com/rafhael100/imagine-seo-engine/pull/274): integra as correções paralelas [F181 #271](https://github.com/rafhael100/imagine-seo-engine/pull/271) e [F182 #272](https://github.com/rafhael100/imagine-seo-engine/pull/272) de validação segura de arrays editoriais, getters, buracos, Map nativo e campos territoriais próprios; 4/4 workflows aprovados na própria HEAD.
- O encadeamento F183→F184 inclui todos os quatro arquivos das duas correções paralelas, mantendo o código anterior F179/F180. Não houve merge de PRs nem alteração em `main`.

## Testes obrigatórios da RC68

Verificar a própria SHA final desta candidata, não apenas as PRs de origem: CI geral, Chromium e dois builds Astro imutáveis do Comercial, normalização e reconciliação IBGE reais, auditoria de 301, F168/F179/F180, F183 e F184. Conferir workflows não executados, configurações de segurança e diffs com revisão independente.

## Pendências para homologação operacional

- **GSC por empresa no Engine:** a propriedade Imagine está acessível no OpenSEO (ferramenta separada); não existe autorização OAuth ou segregação de tenants automaticamente transferível ao SEO Engine/Portal.
- **Migração HTTP/www/en-us:** exportar inventário privado de URLs GSC, revisar cada equivalente editorial e executar 301/canonical/hreflang/rollback em staging autorizado.
- **Municipal:** o cadastro territorial oficial é evidência de códigos, não de disponibilidade comercial local, demanda e originalidade; Onepage/Landing Page seguem escopo inicial de planejamento com revisão humana por localidade.
- **AppSec e LGPD:** revisão independente do diff cumulativo e de sessão/MFA/grants/consentimento, retenção, revogação e chaves de assinatura.
- **Leaseweb:** checar ambiente autorizado isolado, TLS, recursos/portas, backup/restauração e rollback real antes da primeira publicação.
- **GO humano:** decisão separada para merges, publicação, indexação e DNS. CI verde não constitui GO.

**Nenhum token, arquivo GSC, lead, planilha territorial, acesso de VPS, cobrança ou credencial foi gravado na PR.**
