# SEO F174 — fonte oficial alternativa: Áreas Territoriais 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

A API de Localidades IBGE permanece indisponível para o runner HTTPS, embora a DTB 2025 tenha sido capturada e normalizada com integridade demonstrada pelas PRs [F170 #257](https://github.com/rafhael100/imagine-seo-engine/pull/257), [F171 #258](https://github.com/rafhael100/imagine-seo-engine/pull/258) e [F172 #259](https://github.com/rafhael100/imagine-seo-engine/pull/259).

A F174 investiga um **segundo produto publicado pelo IBGE**: `Áreas Territoriais 2025`, arquivo ODS original:

`https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/areas_territoriais/2025/AR_BR_RG_UF_RGINT_RGI_MUN_2025.ods`

A CI executa **uma única captura HTTPS/TLS**, sem redirecionamentos nem tentativas repetidas, com limite de 1 MB, CRC ZIP verificado, inspeção limitada das abas e reconhecimento de eventuais códigos de sete dígitos. A saída contém hash do binário, tamanhos, contagens e cabeçalhos públicos necessários para projetar o parser de reconciliação. Nenhum workbook é comitado, armazenado como artefato ou enviado à produção.

Uma eventual concordância das publicações DTB e Áreas Territoriais pode fornecer evidência estrutural valiosa, mas **ambos os produtos têm o IBGE como órgão publicador**; isso não é autenticação por autoridades distintas nem aprovação editorial ou jurídica. O sistema deve manter HOLD para GSC por tenant, revisão municipal de conteúdo, staging seguro Leaseweb, LGPD, backup e rollback.

Não repetir chamadas em caso de indisponibilidade. A análise de estrutura da F174 não aprova nenhuma publicação automática nem executa DNS ou deploy.
