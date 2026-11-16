# SEO F172 — validar o cadastro territorial DTB 2025 original

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Evidência de origem

- [F170 #257](https://github.com/rafhael100/imagine-seo-engine/pull/257): ZIP oficial DTB 2025 baixado por TLS do GeoFTP IBGE, SHA-256 `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`, CRC validado.
- [F171 #258](https://github.com/rafhael100/imagine-seo-engine/pull/258): workbook original `DTB_Municípios`, data-base 31/12/2025, **5.571 geocódigos completos distintos** observados na planilha ODS.

## O que a F172 acrescenta

A F172 implementa o normalizador offline `scripts/normalize-official-dtb-2025.py`, usando apenas bibliotecas Python padrão. Exige a hash da captura F170 antes de abrir o ZIP, encontra um único workbook municipal ODS, lê os campos oficiais `UF`, `Código Município Completo` e `Nome_Município`, e recusa códigos, nomes, UFs, duplicações e contagem inesperados.

Confere estruturalmente a presença de 27 UFs, **5.569 candidatos a município** e as duas unidades territoriais especiais já conhecidas: Brasília/DF e Fernando de Noronha/PE, em um total de 5.571 linhas. Não confundir esses 5.571 códigos com 5.571 municípios jurídicos.

Produz somente no diretório efêmero do runner um CSV `ibgeCode;state;city`, ordenado pelo geocódigo, com permissão `0600`. Executa sobre o CSV o parser **já existente** do SEO F156 `parseNormalizedDtb2025Csv`, confirmando a compatibilidade com as regras independentes de estrutura nacional e a contagem de unidades especiais. Nenhum arquivo bruto, CSV, nome de cidade ou índice municipal é enviado à PR; apenas hashes/contagens e flags de HOLD.

Testes de laboratório com arquivos ODS sintéticos provam leitura de código/UF/nome, recusa de duplicatas e conflitos e rejeição de conteúdo perigoso. O download oficial é pontual, sem retry automático, e deve ser interrompido caso a origem não responda.

## O que continua faltando

Essa rotina autentica o transporte e vincula os bytes à captura F170, mas **não é uma confirmação independente da edição por outra fonte**. Ainda é necessário comparar os mesmos municípios com a API de localidades ou outra referência oficial autenticamente independente, aprovar editorialmente o conteúdo local e comprovar atendimento/serviço e interesse de busca.

A issue [#230](https://github.com/rafhael100/imagine-seo-engine/issues/230) fica aberta até essa reconciliação, junto dos gates de GSC por tenant, Portal/CRM, staging Leaseweb, backup/restauração, rollback e GO humano.

Nenhuma página foi indexada, publicada ou atualizada em DNS/produção.
