# SEO F170 — tentativa controlada de captura oficial DTB 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Bloqueio correlato: [issue #230](https://github.com/rafhael100/imagine-seo-engine/issues/230).

## Fonte original

O próprio portal oficial do IBGE aponta para o diretório do GeoFTP contendo `DTB_2025.zip`:

`https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/divisao_territorial/2025/DTB_2025.zip`

A listagem pública informa o arquivo de aproximadamente 1,6 MB e alteração em 26/03/2026. O portal descreve os relatórios XLS/ODS por municípios, distritos e subdistritos.

## Política de captura F170

- Uma tentativa HTTPS em runner Ubuntu 24.04 descartável e sem token GitHub persistido, com certificado TLS verificado pelo sistema.
- Sem seguir redirecionamentos, sem HTTP, proxies alternativos arbitrários, mirroring ou tentativas automáticas repetidas.
- Limites explícitos: 5 MB de arquivo ZIP, 50 MB descompactados, 250 entradas, CRC verificado, paths internos seguros, presença de planilha municipal.
- O arquivo é mantido apenas em `RUNNER_TEMP`, **sem artifact upload, commit, exportação das cidades ou publicação em cliente**.
- O resultado do workflow divulga somente edição, domínio de origem, tamanho, contagem e SHA-256 do binário, mais limites de comprovação.

## Interpretação dos resultados

Sucesso comprova a captura por transporte HTTPS do host oficial e a integridade interna do ZIP, com um digest reprodutível **desta coleta**. Não constitui checksum publicado independentemente pelo IBGE, equivalência com API de localidades, validação da lista de municípios ou aprovação para publicar páginas.

Falha significa que o transporte oficial continua bloqueado no ambiente CI. A issue #230 permanece aberta em ambos os casos até uma segunda fonte independente, reconciliação DTB/F110 e validação editorial humana.

Este workflow é disparado pela inclusão do seu próprio arquivo na PR para uma **única tentativa**, não em cron. Não criar reexecuções frequentes diante de falha de rede.
