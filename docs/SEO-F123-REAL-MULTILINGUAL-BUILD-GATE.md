# Imagine SEO F123 — gate multilíngue integrado ao HTML compilado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

Continua a [F122 #178](https://github.com/rafhael100/imagine-seo-engine/pull/178) e a auditoria F114/F117 já existente. Combina **duas verificações reais e distintas** sem inventar autorização para publicar:

1. F122: o inventário do operador contém PT-BR, EN-US e ES-ES para cada grupo serviço + município, sem colisões, UF incompatível ou prefixos de idioma errados.
2. F114/F117: o **build local de HTML compilado** contém as rotas correspondentes, com idioma da tag `html` coerente, canonical, sitemap, robots e proteções contra prévias editoriais privadas.

**Atualização na F124 (PR filha):** este mesmo gate também executa a prova de cluster obrigatório `hreflang` 3×3 em HTML real. Ausências, alvos errados e aliases ambíguos passam a bloquear o resultado. O relatório Ed25519 v1 do Portal continua intocado.

O módulo `src/geo-multilingual-build-gate.mjs` exporta `reviewMunicipalMultilingualBuild({inventoryInput,buildDirectory,siteUrl})`. Valida o inventário antes de percorrer o sistema de arquivos e trabalha com uma cópia de todos os campos validados, para manter consistência caso o chamador altere seu objeto durante o `await`.

## Resultado

- `blocked`: qualquer lacuna na cobertura de locale, divergência territorial, conflito de inventário, rota ausente, idioma incorreto ou erro técnico do HTML.
- `human_independent_review_required`: não foram encontradas falhas **nesses controles locais**, mas revisão humana e autenticação da origem continuam obrigatórias.
- `localeParity` e `staticBuild`: diagnósticos F122 e F114/F117, ambos estruturados por contagens, tipos e índices em vez de URLs, nomes municipais ou conteúdo.
- `publicationAuthorized`, `indexingAuthorized` e `customerDisplayAuthorized` permanecem sempre `false`.

## Testes F123

A suíte usa páginas HTML **gravadas localmente em diretórios temporários** para PT/EN/ES, com sitemap/robots/canonical. Exercita: os três idiomas coerentes; falta de locale no inventário; idioma divergente no arquivo ES compilado; vazamento de prévia privada no HTML EN; recusa de contexto e campos de autoridade indevidos. Executa-se em Node 22/24, sempre offline.

## Implicações para os próximos passos

Este gate ainda não assina o DTO, não consulta a API IBGE real, não prova que o domínio público serve o mesmo build, não verifica qualidade semântica das traduções nem autentica operadores reais. **Não alterar silenciosamente o formato de F121**, pois o Portal possui verificação Ed25519 com contrato estrito fixado em commit. Qualquer mudança no DTO assinado precisa de versão de contrato, testes negativos de compatibilidade e sincronização controlada entre os repositórios.

Para páginas nacionais, exigir demanda real, singularidade editorial, cobertura do serviço em cada localidade e revisão humana antes de produzir/publicar conteúdo territorial em escala. Não gerar automaticamente páginas doorway.
