# SEO F117 — coerência entre idioma do inventário e HTML realmente compilado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

## Problema resolvido
A F114 localizava as páginas municipais no build comparando o `canonicalPath`, mas uma rota podia estar presente com **idioma diferente** do declarado no inventário. Uma página `/en/...` com HTML em português poderia passar como existente. O Imagine Comercial usa `lang="en"` e `lang="es"` no HTML Astro, enquanto o inventário editorial adota `en-US` e `es-ES`.

## Implementação
- O auditor local F0 retorna `routeLocales` derivado da marcação raiz `<html lang>` já analisada, apenas quando a inspeção de hreflang está ativada. Nenhuma chamada de rede.
- A F114 passa a permitir os cinco códigos de raiz que já eram reconhecidos no auditor: `pt-BR`, `en`, `es`, `en-US`, `es-ES`.
- Correspondência restrita: inventário `pt-BR` requer raiz `pt-BR`; `en-US` aceita `en` ou `en-US`; `es-ES` aceita `es` ou `es-ES`. Não existe fallback entre idiomas.
- Se um `canonicalPath` existir mas tiver idioma incorreto, `reviewStatus=blocked` e `expectedRoutesWrongLocale` é incrementado. Até 200 índices de registros são enviados à revisão, **sem expor URLs**.
- O auditor de hreflang existente continua exigindo destinos e clusters recíprocos; esta verificação acrescenta a coerência **inventário → HTML raiz**, que antes não estava coberta.

## Limitações
A coerência entre idiomas não valida a qualidade de uma tradução ou se ela foi aprovada por editor humano. Inventário e build continuam locais e não autenticados como produção. Resultados `human_independent_review_required` nunca significam autorização de publicação.

## Testes
`npm test` executa arquivos HTML temporários reais para verificar discrepância PT/EN, equivalência `en-US/en` e `es-ES/es`, idioma `fr-FR` não permitido e proteção contra divulgação de caminhos. O workflow Astro fixo permanece como controle de compatibilidade.

**Sem merge, deploy, alteração da main, API Google ou produção.**
