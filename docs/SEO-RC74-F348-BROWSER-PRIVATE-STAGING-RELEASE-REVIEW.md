# Imagine SEO RC74 — Comercial F348 e custódia privada de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base cumulativa

A [RC73 #290](https://github.com/rafhael100/imagine-seo-engine/pull/290) concluiu **64/64 workflows SUCCESS** na revisão `ce7eb2932e9e7257f1ac8f5039acd3873d280c55`. Inclui o cadastro oficial IBGE DTB/Áreas 2025, política editorial territorial, GSC PAGE/301, HTTP HEAD real em laboratório, Nginx/Docker isolado, proteção F189, auditoria de diff F188 e a atualização do Comercial F344→F346 com Chromium.

A RC74 acrescenta:

1. [F194 segurança do Compose #292](https://github.com/rafhael100/imagine-seo-engine/pull/292), SHA `57df75eba5550db9a00672d67ebf835c89652d66` — inventários de rede/portas, mapas históricos e Compose exigem diretórios `0700`, fontes `0600`, fora de checkout Git, e configuração Nginx `0644` só sob pasta privada. **3/3 workflows SUCCESS**, incluindo Nginx em Docker real e Node 22/24.
2. [F194 paralela da transparência Comercial #291](https://github.com/rafhael100/imagine-seo-engine/pull/291) — revisão da mudança F346→F348, com aviso multilíngue de que a contratação pública ainda não está disponível; **2/2 workflows SUCCESS** sobre sua própria HEAD. Seus arquivos foram integrados sem refazer código.
3. [F195 #293](https://github.com/rafhael100/imagine-seo-engine/pull/293), SHA `ce06622e662696d48adfd8ad1bfeb5f9f2dd2b5b` — builds **F346→F348** imutáveis, verificação real das SHAs por Git, rejeição de symlinks, comparação de rotas, canonical/hreflang, **Chromium Playwright F348 PT/EN/ES** e a integração F187 com respostas HTTP HEAD reais em `127.0.0.1` (301 válido e quatro falhas esperadas). **2/2 workflows SUCCESS**.
4. [F196 #294](https://github.com/rafhael100/imagine-seo-engine/pull/294), SHA `6ec8ea412fb0adda676187a68a819408c1ee496b` — leitura de inventário Docker F147 exige arquivo `0600`, pasta `0700`, posse do operador, origem fora de todo checkout Git/worktree, rejeição de symlinks e inode estável; **2/2 workflows SUCCESS**.

A revisão Comercial **F348** `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444` apresenta **8/8 workflows SUCCESS** no próprio repositório. A análise CI desta RC74 verifica os commits pinados, mas não altera o site público ou as integrações de pagamento.

## Aceite técnico pendente na RC74

Reexecutar **todos os workflows na própria HEAD final da RC74** (não presumir SUCCESS a partir dos filhos), incluindo build F348 e seu navegador, GSC/301 F183–F187, F193 privacidade de exportações, F194 Compose, F196 F147, Nginx/Docker real F149/F150, IBM/IBGE nacional, política editorial e F188 diff cumulativo. Zero falhas e zero jobs pendentes antes de classificar a candidata como tecnicamente revisável.

## Bloqueadores externos reais

- **OAuth GSC no Portal/SEO Engine**: os componentes de login MFA, PKCE, callback de uso único, `sites.list` e verificação de propriedade existem **apenas em laboratórios e branches**, como [Portal F418 #817](https://github.com/rafhael100/imagine-portal/pull/817) e [Portal GSC F117 #816](https://github.com/rafhael100/imagine-portal/pull/816). Precisam ser integrados operacionalmente a Google/consentimento por tenant, vault, token exchange readonly e revogação auditável. A conexão OpenSEO externa NÃO equivale a OAuth do Portal.
- **Revisão independente AppSec/DBA/LGPD** do diff cumulativo (incluindo dados e segredos, autorização por empresa, provedores e drivers), e confirmação de serviço local e conteúdo editorial não-repetitivo antes da indexação.
- **Staging Leaseweb** com acesso real aprovado: DNS/TLS, 301/canonical/hreflang, inventário atual de portas/containers, isolamento de CRM, backup/restauração, rollback, auditoria e aceite humano. Os testes Docker e 127.0.0.1 em runner não autenticam a VPS.
- **Decisão humana GO** específica para merges em main, deploy, DNS, publicação, indexação e cobrança.

**O escopo desta PR permanece somente código e CI. Nenhum merge, deploy, DNS, custo adicional, token de cliente ou anúncio real é realizado.**
