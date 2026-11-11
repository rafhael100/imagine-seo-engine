# SEO-F1 — Inteligência de oportunidades de busca (offline)

## Problema
Precisamos priorizar o crescimento nacional de `imaginecomunicacao.com.br` a partir de dados reais, sem tratar estimativas ou posições médias como ranking exato e sem depender de ferramentas pagas.

## Implementado
- `analyzeQueryExport(report)`: analisa **linhas já exportadas** da API Search Analytics, com dimensão `query` explícita e intervalo de datas.
- Agrupa por intenção comercial: Landing Pages, criação de sites, site por assinatura, Onepage, Google Ads, Meta Ads, SEO, outros.
- Separa buscas de marca (Imagine) e não associadas à marca; informa impressões, cliques, CTR e posição **média ponderada** somente para as linhas fornecidas.
- Indica `review_content_and_ctr` como **candidato** a revisão, jamais ação automática ou previsão de ranking.
- Filtra termos que aparentem conter e-mails/telefones/identificadores; relatório não expõe consultas textuais brutas, para reduzir risco de dados pessoais.
- Recusa linhas inválidas, CTR incoerente e dimensão diferente; registra limitações sobre dados anônimos e truncamento.
- CLI `node scripts/report-gsc-offline.mjs arquivo.json`. Não faz conexão com Search Console, não solicita credenciais e não armazena relatório.

## Entrada aceita
JSON no formato:
```json
{
  "dimensions": ["query"],
  "startDate": "2026-11-01",
  "endDate": "2026-11-08",
  "rows": [
    {"keys":["criação de landing page"],"clicks":10,"impressions":200,"ctr":0.05,"position":9.1}
  ]
}
```
Os valores acima são **inteiramente fictícios e demonstrativos**, não se referem à Imagine.

## Necessário antes do uso operacional
Autorização expressa de conexão OAuth Search Console, propriedade verificada, consentimento/contrato, tratamento LGPD e de queries sensíveis, paginação/quotas, atraso de dados, métricas por país/dispositivo/página, e comparação com GA4 e receita do Portal. Seria inadequado emitir rankings nacionais ou alegar aumento de receita a partir desta saída isoladamente.

**Fase P1 em PR draft. Sem produção ou gastos.**
