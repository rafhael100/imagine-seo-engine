# SEO F131 — auditoria offline de origens www/apex e HTTP/HTTPS observadas no GSC

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Desenvolvimento após a RC48 (migração 301 e prontidão GA4). Não introduz OAuth, requisições HTTP nem divulgação de métricas reais.

## O problema

Uma propriedade de **domínio** do Google Search Console pode devolver páginas indexadas ou visitadas sob origens diferentes: `https://www`, `http://www`, `https://apex`, subdomínios etc. Somar linhas ou promover redirecionamentos automaticamente pode levar a interpretações erradas. A presença histórica de impressões **não prova** falha atual no servidor, nem confirma canônica, indexação ou impacto de uma migração.

## Implementação

`reviewOfflineGscPageOrigins(input)`, em `src/gsc-page-origin-parity.mjs`, requer dados originais, formatados como resposta **por página** (não por consulta):

```js
{
  sourceType:'operator_supplied_gsc_pages_unverified',
  property:'sc-domain:example.test',
  canonicalOrigin:'https://example.test/',
  startDate:'2026-10-17',endDate:'2026-11-13',
  dataState:'final',dimensions:['page'],
  rows:[
    {keys:['https://www.example.test/'],
     clicks:2,impressions:100,ctr:0.02,position:15}
  ],
  hasMore:false
}
```

- Campo `canonicalOrigin` vem de decisão operacional prévia, jamais é inferido das métricas.
- Exige propriedade de **domínio**, intervalo de dias válido, dados `final`, páginas com URL completa restrita ao domínio e contadores/CTR consistentes.
- Rejeita acessores, arrays esparsos, campos desconhecidos, URLs externas, portas, credenciais, caminhos perigosos e linhas duplicadas.
- Classifica caminhos por origem canônica HTTPS, canônica HTTP, `www` alternativo HTTP/HTTPS e outros subdomínios.
- Detecta números de caminhos lógicos observados em origens distintas, e variantes da página inicial.
- **Nunca devolve URL, host, caminho, consulta, hash, códigos pessoais nem propriedade**. Se qualquer URL tiver parâmetros ou fragmentos privados, todas as métricas são **ocultadas** por prudência.
- Mantém `coverageStatus` explícito: `hasMore=false` indica somente que não há paginação declarada, **não prova** propriedade integral nem tráfego completo.

## Gates

A saída é apenas diagnóstico para revisão de canônica/redirects. O script **não faz conexão Google**. Mesmo uma origem com impressões zero não comprova que a página saiu do índice. Para homologação real: confrontar Search Console autenticado com `curl -I`/HTTP 301 de staging, canonical HTML, sitemap, hreflang e o contrato F127–F129, após consentimento e gate de deploy.

**Não colocar dumps reais, termos de busca, IDs de conta ou dados de cliente no repositório GitHub público.** A suíte utiliza exclusivamente `example.test` sintético.
