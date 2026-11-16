# Imagine SEO RC65 — pacote cumulativo de engenharia e consistência territorial oficial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

A RC65 continua a [RC64 #256](https://github.com/rafhael100/imagine-seo-engine/pull/256), que concluiu 49/49 workflows de PR com sucesso na HEAD `5bc82037f983f7a3e8943039934aa3239c63862a`. A cadeia cumulativa preserva F159–F169 (Chromium/Comercial, segurança de Actions, auditorias e regressões reais, controle editorial nacional e preservação de URLs legadas).

## Evidências territoriais novas

- [F170 #257](https://github.com/rafhael100/imagine-seo-engine/pull/257): captura HTTPS/TLS direta do ZIP oficial DTB 2025 — SHA-256 `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`.
- [F171 #258](https://github.com/rafhael100/imagine-seo-engine/pull/258): leitura da aba oficial DTB_Municípios e da data-base 31/12/2025.
- [F172 #259](https://github.com/rafhael100/imagine-seo-engine/pull/259): normalização de 5.571 geocódigos por UF e nome, 27 UFs, 5.569 municípios e 2 unidades especiais, compatíveis com o parser F156. SHA-256 CSV privado `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`.
- [F174 #261](https://github.com/rafhael100/imagine-seo-engine/pull/261): captura de segundo produto oficial Áreas Territoriais 2025 ODS — SHA-256 `029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1`.
- [F175 #262](https://github.com/rafhael100/imagine-seo-engine/pull/262): comparação bruta detectou **5.573 códigos no segundo produto e 5.571 na DTB**, 2 códigos extras, nenhum ausente, zero diferenças de UF/nome nos comuns. Primeiro gate falhou corretamente por divergência não classificada.
- [F176 #263](https://github.com/rafhael100/imagine-seo-engine/pull/263): identifica somente as duas unidades públicas adicionais não municipais, **4300001** RS Área Operacional Lagoa Mirim e **4300002** RS Área Operacional Lagoa dos Patos.
- [F177 #264](https://github.com/rafhael100/imagine-seo-engine/pull/264): classificador *fail-closed* exige exatamente esses dois códigos, UF e nomenclatura, reconcilia os **5.571 códigos remanescentes sem nenhuma divergência**, mantendo `indexingAuthorized=false`.
- [F178 #265](https://github.com/rafhael100/imagine-seo-engine/pull/265): CI exige que o comparador bruto produza **o delta conhecido e status HOLD** antes da classificação F177. 2/2 workflows da HEAD F178 SUCCESS. Qualquer terceiro código ou alteração desconhecida continua falhando.

**F173 #260 NÃO foi incorporada**: a chamada oficial à API de Localidades falhou por timeout de conexão HTTPS, documentado na [issue #230](https://github.com/rafhael100/imagine-seo-engine/issues/230). Não confundir dois produtos do mesmo IBGE com duas autoridades independentes ou ocultar o resultado da API.

## Gates de aceite da própria RC65

- Executar todos os workflows disparados na SHA consolidada RC65 e registrar falhas e arquivos não cobertos; sucessos das PRs de origem não bastam.
- Garantir a ausência de publicação automática de municípios, CSV bruto, tokens, dados de cliente, URL privada ou regra de redirect.
- Exigir verificação independente AppSec/SEO/LGPD/DBA e da edição/efetiva classificação jurídica; não gerar páginas nacionais repetitivas.
- Homologar o Imagine SEO Engine com OAuth GSC por empresa/tenant, consentimento explícito e paridade Portal/CRM. A conexão GSC existente no OpenSEO **não é transferência de credenciais para o Engine**.
- Conferir URLs históricas HTTP/WWW/EN-US com redirecionamentos equivalentes e aprovados editorialmente; testes reais em staging isolado na VPS Leaseweb, backup/restauração, rollback, TLS e revisão humana de release.

O pacote documental e a CI fornecem evidências técnicas auditáveis; **nenhuma CI isoladamente concede autorização de merge, deploy, DNS, indexação ou cobrança**. O sistema mantém `publicationAuthorized=false` e decisão HOLD até todos os gates operacionais e humanos.
