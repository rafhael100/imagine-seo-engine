# SEO F134 — conferência offline de respostas HTTP 301 de homologação

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [RC49 #194](https://github.com/rafhael100/imagine-seo-engine/pull/194) e da frente F127–F129 de mapeamento de URLs legadas.

## O que melhora

F127/F128 comprovam somente o **planejamento** do 301 e a presença dos destinos no HTML compilado. F134 confere os **recibos de respostas HTTP fornecidos pelo operador**, permitindo identificar se a execução observada correspondeu ao plano. Sem recibos confiáveis e equivalência editorial, não autorizar alteração do site.

`reviewOfflineLegacyHttp301Receipts({migrationInput,capture})` exige o manifesto F127 completo e um segundo documento estrito:

```js
{
  sourceType:'operator_supplied_http_head_captures_unverified',
  observations:[{
    fromUrl:'http://www.example.test/',
    status:301,
    location:'https://example.test/',
    finalUrl:'https://example.test/',
    finalStatus:200,
    redirectHops:1
  }]
}
```

As observações do exemplo são **sintéticas**. O validador exige exatamente um recibo por candidato, origem listada, **301 permanente** (igual ao contrato F127), um salto, `Location` absoluto exato no destino aprovado, URL final idêntica e resposta final 200.

Bloqueia: recibo ausente, HTTP 302/307 temporário, destino externo, salto extra, status final incorreto e qualquer mapeamento F127 inválido. Entrada com campos inesperados, duplicatas, status malformados e arrays com acesso suspeito é recusada. Saída contém **somente contagens e índices**, nunca URLs, cabeçalhos, hosts, códigos privados ou corpos HTML.

## Evidência de staging e limitações

Este código não executa `curl`, não abre conexão, não consulta DNS/TLS nem certifica origem dos recibos. A checagem precisa ser feita **por operador confiável no staging isolado**, com inventário privado e captura autenticada (data, rede, destino e certificado conferidos independentemente). Não coletar cookies, tokens, dados pessoais ou respostas com sessão.

Para homologação, verificar também:
- Canonical do HTML final, noindex/robots de staging, idioma/hreflang e sitemap.
- Resposta GET quando HEAD divergir, persistência/consistência de redirects e rollback.
- Conteúdo equivalente sob revisão humana, sem direcionar páginas antigas ao destino irrelevante.
- Plano de backup/restauração e aprovação antes de qualquer alteração DNS/Nginx/Cloudflare.

**Importante:** `reviewStatus='human_http_staging_review_required'` não equivale a implantação pronta. Nenhuma regra real de redirect é criada por esta entrega.
