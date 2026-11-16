# SEO-F87 — Resumo executivo sem tendências de amostras com dados ocultados

## Correção

O relatório `buildOfflineSeoBrief` recebia um comparativo orgânico **não verificado**, calculado após excluir consultas pessoais, e ainda emitia variações de cliques/impressões e ações de marketing baseadas no subconjunto restante. Essas métricas podiam chegar ao envelope offline do Imagine Portal e ser interpretadas como variações completas do tráfego.

Agora o construtor exige `trend.summary.redactedRows` como inteiro entre 0 e 200000. Se o número for maior que zero:

- **Não emite** totais orgânicos, deltas de tráfego ou recomendações de tendência: `organic=null`, sem `review_click_drop`, `review_ctr_drop` etc.
- Preserva as **recomendações técnicas do site** (canonical, indexação, links) que independem das consultas GSC.
- Adiciona ressalva fixa de que métricas orgânicas foram ocultadas por redaction, sem reproduzir consultas, URLs ou mensagens livres.
- O envelope `preparePortalSeoHandoff` herda `organic=null` e não contém ações orgânicas nesse caso; todas as permissões de cliente e publicação permanecem falsas.

Uma amostra sem linhas ocultadas ainda é **somente o subconjunto fornecido**, não confirmação de tráfego total. Esta correção não autentica a procedência: um relatório declarado pelo operador pode ser forjado, motivo pelo qual a nova F86 é preferível para construir comparações a partir das duas exportações **originais**.

## Provas

A suite testa tendência real com e-mail fictício redigido e queda numérica, confirma que nenhum sinal orgânico chega ao resumo executivo ou ao Portal, mantém revisão técnica, recusa `redactedRows` omitido, negativo, fracionário ou fora do limite e preserva o caso sem redaction.

**DRAFT/NO-GO:** sem Google real, OAuth, tenant grant, acesso a clientes, migração, 301, deploy, publicação ou merge em main; exige CI Node22/24 e revisão AppSec/LGPD/SEO independente.
