# Imagine SEO F122 — cobertura municipal PT-BR / EN-US / ES-ES

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [Engine F121](https://github.com/rafhael100/imagine-seo-engine/pull/177) sobre a RC45. Esta entrega é uma checagem **offline, somente leitura**, sobre inventário editorial fornecido pelo operador, sem GSC/IBGE online, sem dados de clientes e sem publicar nada.

## Problema

A validação F108 identifica duplicidade de chave municipal, caminho canônico ou conteúdo declarado; F117 compara idiomas das páginas que existem no HTML real. Nenhuma dessas duas provas, isoladamente, garante que cada combinação serviço + geocódigo municipal presente no inventário possua as três versões previstas pela estratégia internacional da Imagine. A ausência de uma versão não pode ser interpretada como tradução pronta nem gerar automaticamente conteúdo localizado.

## Implementação

- `reviewMunicipalI18nParity(inventoryInput)`, em `src/geo-i18n-parity-review.mjs`, valida primeiro o contrato rigoroso F108 e agrupa as linhas por **serviço + geocódigo**.
- Verifica a cobertura explícita dos três idiomas **pt-BR, en-US e es-ES** por grupo; informa somente **índices** das linhas de referência e siglas de idiomas faltantes.
- Bloqueia caminhos de idioma inconsistentes: PT na raiz (não `/en/` nem `/es/`), inglês em `/en/` e espanhol em `/es/`.
- Detecta UF divergente para o mesmo serviço/geocódigo e herda as colisões F108.
- Limita cada família de diagnóstico a 200 elementos, expondo contagens de truncamento. O relatório não contém cidade, geocódigo, URL, caminho, texto de página, domínio, digest ou dados de leads.
- 5.600 grupos de municípios com três idiomas são exercitados em testes sem assumir que códigos sintéticos representem cidades reais.

## Execução local read-only

```bash
node scripts/review-municipal-i18n-offline.mjs /CAMINHO/PRIVADO/inventario.json > resultado-seo-f122.json
```

O arquivo de entrada segue exatamente o esquema `operator_local_inventory_unverified` da F108. O comando aceita exclusivamente um arquivo regular, rejeita link simbólico e entrada maior que 24 MiB; não acessa rede nem grava no repositório.

Códigos de saída: **0** = cobertura formal completa, *ainda requer revisão humana*; **2** = correções necessárias; **1** = entrada inválida. O relatório sai em JSON sem identificadores de empresa, município ou página; erros genéricos não exibem caminhos privados.

## Limites e próximos gates

Cobertura de locale **não demonstra** correspondência IBGE oficial, tradução genuína, atendimento efetivo na cidade, qualidade editorial, demanda de busca, hreflang recíproco no HTML compilado, indexação Google, conversão em leads ou autorização de publicação.

A integração F114/F117 continua responsável por ler o HTML real local; esta etapa avalia somente inventário. Nunca use apenas a existência das três linhas para publicar milhares de páginas: cada página requer conteúdo original, utilidade territorial, serviço comprovado e revisão editorial independente, evitando páginas doorway.

Próxima integração recomendada: combinar os diagnósticos F122 com a auditoria F114/F117 e o relatório assinado F121, com revisão de compatibilidade do DTO do Portal. Essa integração exige nova mudança controlada em ambas as pontas — esta PR não altera o protocolo Ed25519 nem a HEAD imutável fixada no Portal.
