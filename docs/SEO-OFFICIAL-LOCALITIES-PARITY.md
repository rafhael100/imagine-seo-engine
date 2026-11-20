# API Localidades, DTB e Áreas Territoriais: paridade oficial observada

**17/11/2026 em São Paulo · 18/11/2026 UTC · DRAFT / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Evidência real preservada

A [issue #230](https://github.com/rafhael100/imagine-seo-engine/issues/230) registrou timeout da API Localidades na F173. A F170/F172 e a F177 já haviam comprovado a captura e a concordância entre DTB 2025 e Áreas Territoriais 2025, dois produtos do mesmo órgão. Em **2026-11-18T00:09:57.736Z** (17/11, 21:09:57.736 em São Paulo), uma nova captura pelo **transporte F117 existente**, sem substituição de `fetch`, recebeu a API oficial e produziu referência e recibo privados. Os validadores usados são os da base `d5af3feb7af58a439b3ea778ccf45452d79e6b6b` (#316), sem mudança de regra.

| Fonte oficial | Captura observada | SHA-256 |
| --- | --- | --- |
| [API Localidades v1](https://servicodados.ibge.gov.br/api/v1/localidades/municipios) | HTTPS, HTTP 200, URL exata sem redirects, JSON; 2.470.036 bytes | `86ecdccdf97d72e7e5e46f0854cfcea8bacc28154cc1bc4ed0e6110e3a6c9c02` |
| [DTB 2025 ZIP](https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/divisao_territorial/2025/DTB_2025.zip) | HTTPS, HTTP 200, verificação TLS válida, zero redirects; 1.635.600 bytes | `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27` |
| [Áreas Territoriais 2025 ODS](https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/areas_territoriais/2025/AR_BR_RG_UF_RGINT_RGI_MUN_2025.ods) | HTTPS, HTTP 200, verificação TLS válida, zero redirects; 214.327 bytes | `029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1` |

Os hashes dos dois binários coincidem com os pins anteriores F170/F174. A normalização F172 produziu o CSV pinado `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`. A referência JSON da API tem 513.305 bytes e SHA-256 `8f41c869d5ee7d52c8c0cb16c3763a20f7d7d397116901a966e0aebbbc6fccff`.

O checkpoint operacional fica fora do Git, em diretório `0700`, com referência, recibo, binários, CSV e relatórios `0600`. O F117 registra o digest dos bytes JSON recebidos e não persiste esse corpo bruto; a revisão posterior recomputa o digest da **referência normalizada** e o confronta com o recibo. Nenhum hash aqui é uma assinatura IBGE ou um checksum publicado independentemente pelo órgão. Nenhuma listagem municipal ou planilha integra esta entrega.

## Resultado dos contratos existentes

Todos os comandos abaixo terminaram com **exit 0** sobre os arquivos reais preservados:

| Verificação | Resultado |
| --- | --- |
| F117: captura e verificação do recibo | 5.571 registros; digest normalizado correspondente ao recibo |
| F154/F153: cobertura nacional da mesma referência | 5.569 candidatos a município, duas unidades especiais, 27 UFs; `blockedComponents=[]` |
| F172: normalização do ZIP DTB pinado | 5.571 linhas; CSV com digest anterior confirmado |
| F157/F156: mesma referência e recibo contra DTB | 5.571 × 5.571; zero códigos ausentes/extras, divergências de nome ou UF; `sameReferenceBytesUsedForBothReviews=true` |
| F177: essa mesma DTB contra Áreas Territoriais | 5.573 → 5.571 após somente as duas exclusões operacionais já previstas; zero diferenças de código, nome ou UF |

A F177 conserva a identidade exata das duas áreas operacionais previstas em [seu contrato](SEO-F177-OFFICIAL-2025-OPERATIONAL-AREAS.md); não foi criada uma exclusão genérica. Os validadores de comparação mantêm suas regras existentes de normalização de nomes.

## Integração do gate real F120

O único workflow ampliado é `.github/workflows/seo-f117-official-ibge-source-ci.yml`. Os jobs offline e live fazem checkout da mesma HEAD da PR; em dispatch, usam a SHA do evento. A condição opt-in permanece: aplicar a etiqueta **`verify-official-ibge`** à PR gera o evento `pull_request.labeled`; se já aplicada, remover e reaplicar. `workflow_dispatch` continua disponível quando o workflow estiver no ramo padrão. Os testes offline Node 22/24 precisam passar antes do job `live-official-source`.

O job real faz uma captura F117, verifica recibo e F154, baixa os dois produtos nas URLs e hashes já previstos em F172/F175, normaliza a DTB e executa F157/F177 com os mesmos caminhos de referência e CSV. Cada fonte tem uma única requisição, sem retry; redirects não são seguidos, TLS permanece obrigatório e os limites existentes são mantidos. Uma falha interrompe a cadeia. A limpeza `always()` remove os cinco arquivos de entrada/normalização, inclusive após falha, sem upload de artifacts.

**Esta evidência local não é uma execução do novo job no GitHub.** A prova CI deve ser registrada separadamente, na SHA publicada, após ativar o opt-in. A captura local preservada permite revisar o resultado mesmo que a fonte volte a falhar naquele runner.

## Limites da conclusão

Há concordância estrutural observada entre a API Localidades e dois produtos oficiais IBGE de 2025. As três fontes são do mesmo órgão; não representam autoridades independentes. Não se atualizou edição territorial, não se aprovou a classificação jurídica completa e não se converteu 5.571 registros estatísticos em 5.571 municípios jurídicos.

F154/F157/F177 continuam em **HOLD**, com aprovação editorial, atendimento local, propriedade Google por tenant, publicação e indexação não autorizados. As flags `false` são os limites deliberados dos contratos, não uma falha das comparações. A evidência supera o timeout histórico como diagnóstico atual neste ambiente e horário; não garante disponibilidade futura nem encerra os gates editoriais, AppSec/LGPD, staging, backup/restore, rollback e aceite humano da issue #230.
