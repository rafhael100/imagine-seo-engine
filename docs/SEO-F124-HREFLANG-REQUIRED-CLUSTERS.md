# SEO F124 — exigir cluster completo de hreflang PT/EN/ES no HTML real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [F123 #179](https://github.com/rafhael100/imagine-seo-engine/pull/179), sem mudar o contrato F121 do relatório assinado Ed25519 nem o Portal.

## Por que é necessário

A auditoria F100/F101 já valida reciprocidade e consistência **se as declarações existirem**. Três páginas sem nenhuma tag `hreflang` podiam passar na checagem de integridade de tags, embora não possuíssem relações multilíngues. F124 exige explicitamente o conjunto 3×3 entre cada grupo serviço + geocódigo, considerando PT-BR, EN-US e ES-ES, inclusive autorreferência.

- PT-BR aceita `pt-BR`; EN-US aceita **um** alias `en` **ou** `en-US`; ES-ES aceita **um** `es` **ou** `es-ES`. Dupla declaração de aliases alternativos é ambígua e bloqueada.
- Todos os 9 links esperados por grupo devem existir e apontar **exatamente** às rotas canônicas declaradas no inventário.
- A falta de uma página compilada ou um link apontando para idioma/rota errados bloqueiam o resultado.
- A auditoria técnica anterior permanece ativa: canonical, sitemap, robots, idioma do HTML, relação de retorno e prévias privadas.

## Implementação

- `src/audit-static.mjs` ganhou `includeHreflangDeclarations:true`, opt-in **somente junto de** `checkHreflang:true`, para expor internamente relações path/idioma já reconhecidas pelo parser seguro F102. A resposta **bruta** contém paths e só pode ser usada pelo revisor local confiável.
- `src/geo-multilingual-build-gate.mjs` integra esta verificação ao gate F123: ausência de relações obrigatórias faz o resultado composto voltar a `blocked`, mesmo com três páginas presentes e sem outros erros F114. A auditoria local realiza uma leitura adicional do build para este controle; o build precisa permanecer imutável entre leituras.
- `src/geo-hreflang-completeness.mjs` usa F108/F122 como validação prévia, compara cada relação do HTML com o inventário e entrega exclusivamente contagens e índices por linha de inventário, sem geocódigos, cidades, slugs, URLs ou hashes.
- Limite de 20.000 páginas esperadas e no máximo 200 achados no relatório; `omittedFindings` conserva o total não mostrado.
- Resultado `human_independent_review_required` não autoriza indexação ou publicação; resultado `blocked` requer correções.

## Testes de laboratório

Node 22/24 compila HTML local para as três versões, com canonical e sitemap. A bateria F124 confere: nove relações completas; três páginas sem `hreflang`; alvo EN apontando para ES; alias `en` e `en-US` duplicados; inventário incompleto; campos indevidos. A suíte geral de regressão também executa.

## Pendências

O gate F123 já incorpora este controle nesta branch, mas continuam necessários, conteúdo verdadeiramente útil/original, presença comercial em cada localidade, dados oficiais IBGE, tradução editorial e autorização humana, além de segurança, implantação e rollback em staging. Este módulo **não afirma** que o site público exibe esse build nem que o Google o indexou. Não utilizar para gerar páginas doorway.

O Portal continua recebendo o DTO assinado F121 **inalterado**; uma assinatura que inclua F122–F124 exigirá versão de contrato e migração coordenada, sem alteração automática.
