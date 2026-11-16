# SEO F175 — reconciliação de dois produtos oficiais IBGE 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Continua [F172 #259](https://github.com/rafhael100/imagine-seo-engine/pull/259) e [F174 #261](https://github.com/rafhael100/imagine-seo-engine/pull/261), sem incorporar o workflow de API F173, que falhou por timeout.

## Fontes originais e recibos fixos

1. DTB 2025: `https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/divisao_territorial/2025/DTB_2025.zip` — SHA-256 `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`.
2. Áreas Territoriais 2025: `https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/areas_territoriais/2025/AR_BR_RG_UF_RGINT_RGI_MUN_2025.ods` — SHA-256 `029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1`.

Os dois arquivos são publicados no domínio oficial do IBGE, mas pertencem a produtos diferentes: divisão territorial e área territorial.

## Procedimento de comparação

A CI F175 baixa cada binário oficial uma única vez, diretamente por HTTPS/TLS, com limites de tamanho e sem retries, e exige os hashes previamente obtidos na F170/F174. A F172 normaliza a DTB num arquivo privado `0600`, que precisa ter SHA normalizado `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`.

O comparador F175 lê os campos do workbook `AR_BR_MUN_2025`: `CD_UF`, `NM_UF_SIGLA`, `CD_MUN` e `NM_MUN`. Ele confere cobertura nacional de 5.571 códigos, 27 UFs e duas unidades especiais e compara por geocódigo os nomes normalizados e UFs dos dois produtos.

Só publica na CI **contagens agregadas de diferenças**, nunca nomes, códigos ou planilhas. Qualquer divergência deixa o resultado em `HOLD_OFFICIAL_PRODUCT_DISAGREEMENT`, não autoriza avançar para produção nem exporta dados. Mesmo sem diferenças o status continua HOLD até revisão de origem, edição, atendimento local, LGPD, staging e aprovação humana.

## Limitações de autoridade

Fontes separadas do mesmo órgão IBGE fornecem evidências de consistência entre publicações. Não equivalem a duas autoridades jurídicas/estatísticas independentes nem demonstram indexação do Google, atendimento efetivo da Imagine ou qualidade editorial municipal. A API Localidades F173 segue indisponível na CI. Nenhuma geração/publicação de 5.569 páginas está autorizada.
