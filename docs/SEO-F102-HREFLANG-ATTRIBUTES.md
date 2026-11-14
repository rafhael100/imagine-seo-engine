# SEO-F102 — Proteção contra atributos ambíguos em hreflang

## Risco corrigido

O parser leve do auditor usava a última ocorrência de cada atributo no
`<link>`. Navegadores podem escolher outra ocorrência em HTML inválido,
de modo que `href="externo" href="canônico"` ou dois `hreflang` em uma
mesma tag não podem ser aceitos como evidência SEO válida.

## Política

- Com `--multilingual --check-hreflang`, uma tag de idioma deve ter
  exatamente **um** `rel`, **um** `hreflang` e **um** `href`, todos com
  valores entre aspas simples ou duplas (o código não exige a ordem).
- Tags com atributos requeridos repetidos, sem aspas ou não reconhecíveis
  são marcadas com `invalid_hreflang_attributes`.
- A detecção lê também o nome de atributo bruto, para não ignorar
  `hreflang=en` porque o parser conservador não interpreta esse valor.
- Somente links que declaram `hreflang` seguem essa validação; `rel=alternate`
  para RSS, sem idioma, permanece ignorado.
- Não há eco de URLs inseridas no HTML no diagnóstico novo.
- Os limites de 16 alternates por página, de crawl e de findings se mantêm.

## Limites e homologação

Continua sendo análise estática heurística, não um parser DOM completo.
O resultado não prova indexação, conteúdo editorial, consentimento GSC
nem performance real. Não ativa traduções nem faz chamadas à rede.
Revisar o comportamento em um build Astro fixado e fazer regressão
negativa antes de uma liberação.

**DRAFT / NO-MERGE / NO-DEPLOY**.
