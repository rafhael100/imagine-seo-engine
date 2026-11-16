# SEO F173 — duas publicações oficiais IBGE: API Localidades × DTB 2025

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

A F170 obteve por HTTPS/TLS o ZIP original DTB 2025 e a F172 validou seu cadastro municipal contra o parser estrutural F156, resultando em 5.571 localidades, 5.569 municípios e 2 unidades especiais de 27 UFs.

A F173 procura responder à principal dúvida restante: **a API oficial de Localidades do IBGE concorda com a planilha territorial de 31/12/2025?**

## Procedimento controlado

- Uma única consulta sem retry à API pública fixa `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`, em HTTPS/TLS, sem redirecionamento e com limite de 20 MB.
- Somente se a API responder, efetua uma nova leitura pontual do ZIP oficial com a hash F170 imutável `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27`.
- O normalizador F172 produz CSV privado 0600 efêmero a partir do ODS; o comparador Python F173 confere IDs 7 dígitos, UF declarada na API, nomes normalizados, duplicatas e conjuntos de códigos.
- A saída contém apenas contagens de conflitos, hashes de recibo e estados HOLD. Nenhuma lista de municípios, nome, URL de busca, arquivo JSON, planilha ou CSV é armazenada em GitHub, publicada ou enviada a clientes.

## Interpretação

A API e o GeoFTP são endpoints distintos do **mesmo órgão (IBGE)**. Uma concordância é excelente evidência operacional, mas não autentica duas autoridades editoriais independentes e não autoriza milhares de páginas municipais. Discordâncias por data-base ou atualização de nomes/códigos exigem revisão de edição e mantêm HOLD.

Se a API não responder, a captura DTB F170–F172 permanece válida, mas **a comparação independente fica pendente**. Não repetir tentativas continuamente, usar mirror não oficial ou inventar dados.

O release continuará exigindo conteúdo útil e atendimento local, GSC por tenant, migração de URLs reais, AppSec/LGPD, staging Leaseweb, backup/restore, rollback e aceite humano.
