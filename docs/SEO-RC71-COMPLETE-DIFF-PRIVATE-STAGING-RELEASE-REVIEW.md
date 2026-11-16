# Imagine SEO RC71 — inventário completo de diff e proteção de mapas privados de staging

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base técnica aprovada

A [RC70 #280](https://github.com/rafhael100/imagine-seo-engine/pull/280) passou **62/62 workflows** na própria HEAD `935a1a3844c8b1c0c86ebd65cf620661fd443f26`, integrando GSC original F185/F186, captura real HTTP HEAD em 127.0.0.1 F138/F187, Astro Comercial F344, proteção editorial F179–F184, IBGE oficial e controles de segurança anteriores.

Esta candidata acrescenta, sem desfazer nenhuma dessas entregas:

1. [F188 #281](https://github.com/rafhael100/imagine-seo-engine/pull/281) — auditoria cumulativa Git completa, agora incluindo arquivos **apagados** e ambos os nomes de renomeações/cópias. O filtro F160 anterior não incluía deleções, podendo omitir a retirada de controles de segurança. A F188 passou **2/2 workflows**, inclusive teste com um repositório Git temporário de verdade.
2. [F189 #282](https://github.com/rafhael100/imagine-seo-engine/pull/282) — correção de privacidade F145: mapa Nginx precisa permanecer `0644` para leitura pelo uid 101 do container, mas antes podia ser escrito sob diretório host `0755`. Agora a pasta do operador é obrigatoriamente `0700`, o manifesto original `0600`, sem symlinks ou proprietário diferente. Atualizado o fixture F144 e adicionados testes contra arquivo público e diretórios atravessáveis. A F189 passou **3/3 workflows**, inclusive Docker Nginx real em CI.

## Inventário da revisão independente

O [workflow F188 sobre a PR F188](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43906031025) registrou **628 endpoints de caminhos alterados** na revisão cumulativa da época, distribuídos em:
- 63 relacionados a workflows CI e cadeia de suprimentos;
- 4 relacionados a caminhos de identidade/privacidade na classificação nominal;
- 61 relacionados a infraestrutura, staging, Docker, backup ou rollback;
- 102 territoriais/editoriais, 162 de integração, 55 de testes, 122 de documentação e 59 outros.

Pelo agrupamento atual, **128 caminhos são de revisão prioritária** (CI + segurança nominal + infraestrutura). Não confundir essa classificação heurística com auditoria de conteúdo, varredura de secrets, exame de todos os commits ou aprovação AppSec independente. Exigir novo inventário na HEAD da RC71 e uma revisão do diff histórico.

## CI obrigatória da própria RC71

A RC71 deve comprovar **todos os seus workflows** concluídos com SUCCESS nesta HEAD final, incluindo F160/F188, F144/F145/F189, Nginx Docker e CI em Node 22/24, F186/F187 no build Comercial F344 real, GSC F183/F185 e o cadastro territorial IBGE 2025. Uma falha, cancelamento, job pendente ou evidência ainda não obtida mantém NO-GO.

## Bloqueios de homologação

- GSC OAuth `webmasters.readonly` autenticado por **tenant + propriedade** no backend Imagine; a conexão OpenSEO externa não concede essas permissões automaticamente.
- Revisão por pessoa independente AppSec/DBA/LGPD de arquivos críticos, de autorizações reais, segredos, consentimento, RLS, assinaturas e fluxos.
- Migração das URLs históricas HTTP/www/en-us com equivalência editorial aprovada, respostas HTTP reais e verificação de canonical/hreflang em **staging Leaseweb** de acesso autorizado.
- Testes operacionais de TLS, firewall, isolamento, backup, restauração, rollback, revogação e idempotência antes de publicar.
- Autorizar somente conteúdo municipal original, relevante e com serviço local comprovado; o cadastro IBGE não é prova comercial.
- Decisão humana separada para merge, deploy, DNS, indexação e qualquer gasto.

**Nenhuma alteração nesta RC71 autoriza Google API real, VPC/VPS, merge, DNS, deploy, clientes ou indexação.**
