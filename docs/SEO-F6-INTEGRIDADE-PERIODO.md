# SEO-F6 — Validação estrita de calendário e integridade aritmética

## Alterações
- Uma única função valida dias em ISO 8601, incluindo ano bissexto, e compara data inicial e final.
- Exportações offline aceitas: intervalos entre 1 e 92 dias; não interpretar automaticamente datas nem consultar a propriedade.
- CSV, relatório e tendência usam a mesma validação, impedindo combinações inconsistentes.
- Somatórios não podem ultrapassar Number.MAX_SAFE_INTEGER; média ponderada não aceita infinito.

## Comprovação
- Testes Node usam somente dados sintéticos, sem rede ou dados pessoais.
- Sem OAuth, identificadores Google, implantação, publicação, custos ou merge da main.
- A validação de datas não confirma a origem ou propriedade do CSV.
