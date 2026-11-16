# SEO-F2 — Páginas de serviço por municípios: controle de qualidade (sem publicar)

## Motivação
A estratégia SEO nacional da Imagine considera pesquisas com serviço e localização, mas **não recomenda gerar páginas indiscriminadamente** para todos os municípios do Brasil. A abordagem evita páginas de entrada (doorway pages), conteúdo em escala sem valor e substituição automática de nomes de cidades.

## Entregue
- `src/geographic-quality.mjs`: avaliador **offline** para candidatos de páginas locais, sem geração de URL nem indexação.
- Valida formato de código do município (7 dígitos, **não existência** na base do IBGE), sigla de UF, slug do serviço, disponibilidade confirmada, justificativa de ter página própria, conteúdo local mínimo e pesquisa documentada.
- Detecta risco de duplicidade usando trigramas de palavras, removendo o nome da cidade, a UF e o slug do serviço do texto antes da comparação.
- Bloqueia aparências simples de e-mail/telefone e termos com conteúdo insuficiente; avaliação de LGPD completa é posterior.
- Mesmo que todos os requisitos sejam atendidos, devolve `human_editorial_review_required`, com `publishAllowed=false` e `indexingAllowed=false`.
- Testes sintéticos garantem rejeição de modelos que só alteram o nome do município.

## O que o módulo NÃO faz
- Não verifica existência do município no IBGE e não atualiza lista de municípios.
- Não consulta Google, Search Console ou concorrentes e não estima volumes/posições.
- Não prova originalidade, veracidade, atendimento local ou resultados comerciais.
- Não cria página, sitemap, rota, canonical ou deploy.
- O índice de similaridade é apenas um sinal; detecção completa exige revisão editorial.

## Próximos gates
- Obter lista oficial atualizada do IBGE com fonte, versão e auditoria.
- Pesquisar demanda com fontes autorizadas e medir oportunidades de verdade.
- Selecionar pequeno piloto editorial para localização com conteúdo substancialmente próprio e comprovável.
- Aprovação humana antes da geração de URL e indexação; monitorar no Search Console após eventual lançamento.

Prioridade P1 subordinada ao Imagine Comercial. Sem despesas, produção ou merge na main.
