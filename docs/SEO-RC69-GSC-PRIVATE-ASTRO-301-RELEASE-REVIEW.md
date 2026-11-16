# Imagine SEO RC69 — propostas privadas de 301 sobre o build Astro real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base consolidada

Continua a [RC68 #275](https://github.com/rafhael100/imagine-seo-engine/pull/275), que concluiu **59/59 workflows** na HEAD `26cf17a50dc701ce3ba7a22dbc89155822f8a5ca`, preservando toda a cadeia RC60–RC67, os códigos oficiais IBGE de 2025, catálogo Comercial F336, navegador Chromium real, revisões editoriais e proteção F181/F182 contra inputs privados maliciosos.

Incorpora [F185 #276](https://github.com/rafhael100/imagine-seo-engine/pull/276), que já passou em **3/3 workflows** na SHA `1891a36c6a401851ad0bad658671d4fb697ec9a5`:

- A partir de linhas GSC PAGE originais e do inventário de URLs de **HTML Astro realmente compilado**, gera propostas de 301 SOMENTE para troca de protocolo ou www, com o mesmo path existente no build.
- Nunca mapeia automaticamente `/en-us/`, `/es-es/`, páginas sem destino, outros subdomínios ou caminhos suspeitos.
- Se houver query/hash privado, suprime integralmente métricas e não cria manifesto.
- Escreve o arquivo contendo URLs em diretório local privado `0700`, com permissão de arquivo `0600`, sem upload a GitHub ou Portal público.
- A CI F167 compilou o Imagine Comercial F336 fixado por SHA e verificou a homepage real, um candidato 301 sintético e status HOLD, sem rede Google ou staging produtivo.

## Verificação da própria RC69

Executar a CI completa na SHA final RC69 e conferir todos os workflows: Chromium e Astro reais, revisão de 301, F183/F185, IBGE DTB/Áreas oficiais, F179/F180 e controles F181/F182, análise de segurança de Actions e runner Docker isolado. A CI verde **não é** autorização humana nem prova de OAuth real.

## Próximas etapas operacionais

1. Obter consentimento do titular do serviço e a propriedade GSC com permissão **efetiva por empresa/tenant** no backend do Imagine Portal, sem reutilizar tokens do OpenSEO.
2. Guardar dados e credenciais GSC fora do GitHub, com cofre, criptografia, RBAC, MFA, revogação, trilha de auditoria, escopo `webmasters.readonly`, limite de solicitações e proteção LGPD.
3. Produzir uma exportação PAGE real em ambiente privado, gerar o manifesto de F185 e revisar destino equivalente página a página, incluindo `/en-us/`.
4. Homologar respostas 301, canonical/hreflang, indexação controlada, TLS, backups, restauração e rollback em staging isolado Leaseweb, somente com acesso autorizado e inventário de portas.
5. Revisar independentemente AppSec, arquiteturas Portal/CRM, serviço local por cidade e qualidade editorial; obter decisão humana GO específica para merge, deploy e DNS.

**Ainda não há deploy real, propriedade OAuth autenticada no Engine, URL pública de staging aprovada ou autorização para indexação.** O texto desta candidata não dá permissão para gastar, efetuar cobranças, mudar DNS ou publicar.
