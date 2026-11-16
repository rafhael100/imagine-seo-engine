# Imagine SEO RC66 — DTB oficial vinculada ao filtro editorial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Candidata incremental sobre RC65

A [RC65 #266](https://github.com/rafhael100/imagine-seo-engine/pull/266) concluiu **56/56 workflows com sucesso**, reunindo F159–F178 (exceto a tentativa F173 de API indisponível, preservada como bloqueio). As evidências territoriais F170/F172/F174/F178 distinguem corretamente:
- 5.569 municípios brasileiros no DTB 2025;
- 2 códigos territoriais especiais (Brasília e Fernando de Noronha);
- 2 códigos adicionais no produto Áreas 2025, classificados explicitamente como áreas operacionais do RS (Lagoa Mirim e Lagoa dos Patos), nunca como municípios novos.

Esta RC66 também incorpora a [F179 #267](https://github.com/rafhael100/imagine-seo-engine/pull/267), que liga o filtro editorial real de rascunhos F107 à planilha municipal DTB oficial previamente autenticada por TLS e SHA-256 F172, sem assumir que um código correto autoriza páginas locais.

## Evidências verificadas na F179

- [x] CI Node 22/24 sobre rascunhos sintéticos, incluindo UF/nome/código falso, duplicações por cidade, Brasília como unidade especial e bloqueio de falso relatório de aprovação.
- [x] CI da F172 estendida para processar **o CSV real oficial** da DTB e um rascunho sintético, exigindo um código encontrado, publicação proibida e revisão bloqueada por falta de comprovação comercial.
- [x] Validação offline geral do SEO Engine.
- [x] Nenhum arquivo municipal original, texto de cliente ou credencial foi anexado ao repositório.

## Validação da própria RC66

Exigir CI de todos os workflows disparados **nesta HEAD**, revisão de diff cumulativo, confirmação das SHAs das duas publicações oficiais e compatibilidade com Comercial F336. CIs verdes das branches anteriores não bastam para liberar este conjunto.

## Continuam como HOLD operacional

1. Autorização real da propriedade GSC por tenant **dentro do Imagine SEO Engine** e vínculo seguro com Portal/CRM; conexão OpenSEO em outra ferramenta não concede OAuth.
2. Aprovação humana de atendimento efetivo, evidência de demanda e conteúdo editorial realmente original para cada município; não publicar páginas doorway.
3. Revisão independente de segurança, arquitetura, permissão por tenant e LGPD.
4. Testes de staging Leaseweb com TLS, isolamento, rollback, backup e restauração.
5. Homologação de redirects históricos HTTP/www/en-us e cobertura de páginas antes de alterar DNS.
6. Decisão humana GO separada dos recibos de CI. F162 mantém `publicationAuthorized=false` por definição.

**Nenhum merge, deploy, DNS, indexação, cobrança ou integração real de dados é feito por esta candidata.**
