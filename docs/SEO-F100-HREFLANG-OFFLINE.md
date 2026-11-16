# SEO-F100 — Verificação offline de links hreflang

## Objetivo

Revisar referências SEO entre páginas traduzidas de um build local, antes de
qualquer publicação do Imagine Comercial. A checagem é **opt-in**, não usa
Google APIs nem rede e não substitui validação editorial ou um navegador.

## Uso

```bash
node scripts/audit-dist.mjs dist https://imaginecomunicacao.com.br/ --multilingual --check-hreflang --fail-on-warnings
```

`--check-hreflang` exige `--multilingual` para evitar mudanças de contrato
em auditorias atuais. A API local aceita `checkHreflang: true` junto
a `allowedLanguages: ['pt-BR','en','es','en-US','es-ES']`.

## Invariantes

- Inspeciona somente `<link rel="alternate" hreflang="...">` no head real.
  Comentários, scripts e templates inertes não fornecem evidência.
- Aceita `pt-BR`, `en`, `es`, `en-US`, `es-ES` e o valor especial `x-default`. O Comercial #383 produz `en` e `es`.
- Recusa duplicações de idioma e destinos com origem diferente, URLs relativas,
  parâmetros, fragmentos e aliases que não correspondam exatamente às
  URLs canônicas públicas do build.
- Exige que destinos existam entre os HTML locais e que o `lang` da página
  destino corresponda ao `hreflang` declarado (exceto `x-default`).
- Quando uma página declara alternates, exige autorrreferência e retorno
  do destino à página de origem para cada idioma, evitando vínculos unilaterais.
- Limite fechado de 16 links hreflang por página. Diagnósticos não ecoam
  as URLs de entrada; regras de orçamento de crawl e segurança permanecem.
- Páginas sem alternates não são forçadas a inventar versões em outros
  idiomas. F100 não pressupõe qual será a estrutura pública (/en/, /es/, etc.).

## Limitações

Este é um verificador estático conservador; não faz parsing DOM integral,
não garante que todas as páginas tenham tradução, não confirma conteúdo
realmente traduzido, indexação ou recíproca em sites externos. A política de
`x-default` além de origem/canonical também exige revisão editorial.
Antes de usar a flag no Imagine Comercial, validar as rotas reais,
`sitemap.xml`, regras de idioma e paridade das traduções.

A entrega fica **DRAFT/NO-MERGE/NO-DEPLOY** até CI Node 22/24 na HEAD exata,
revisão independente e teste de integração com o Comercial. Sem ativação de
OAuth, DNS/301, VPS, dados de clientes ou publicação automática.
