# SEO F111 — importação local de export da API IBGE Localidades

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continuação da [F110 #157](https://github.com/rafhael100/imagine-seo-engine/pull/157).

## Problema

A F110 valida referências de município/UF/código do operador,
mas o arquivo teria de ser montado manualmente. A F111 acrescenta
um conversor **local e reproduzível**, que lê uma cópia JSON de
registros de municípios no formato da API IBGE Localidades v1.

O programa **não consulta a Internet**. Os arquivos precisam ser
obtidos pelo operador de uma origem que ele consiga verificar.

Referência institucional de estrutura de municípios/geocódigos:
https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15774-malhas.html

API pública de localidades (obtenção externa, não feita por este código):
https://servicodados.ibge.gov.br/api/v1/localidades/municipios

## Entrada e saída

Entrada: arquivo JSON (array de até 6.000 registros), com:
- id numérico de sete algarismos
- nome de município
- regiao-imediata.regiao-intermediaria.UF.sigla
  e/ou microrregiao.mesorregiao.UF.sigla

Se as duas hierarquias estiverem presentes, devem concordar
com a mesma UF. O prefixo UF no geocódigo também é conferido.
Códigos duplicados, campos inesperados, getters, símbolos e
dados inconsistentes bloqueiam a importação inteira.

Saída: arquivo JSON no contrato F110:
- sourceType = operator_supplied_municipality_reference_unverified
- entries = [{ ibgeCode, state, city }, ...]

A fonte não recebe o rótulo "verificada" apenas porque seu JSON
passou na validação de estrutura.

## Exemplo

Após obter e verificar um export municipal JSON localmente:

    node scripts/import-ibge-localities-offline.mjs source.json reference.json
    node scripts/reconcile-geo-reference-offline.mjs drafts.json inventory.json reference.json

O conversor lê no máximo 8 MiB e grava um arquivo privado novo
com permissões restritas (0600 quando suportado). Um arquivo de
destino já existente **não pode ser sobrescrito**. Ele não imprime
nomes ou códigos municipais no console; somente quantidade de
registros e flags de revisão.

## Controles pendentes

- **Conferência de procedência:** TLS, origem/download efetivo,
  integridade do JSON e edição/dia de referência devem ser
  confirmados e registrados independentemente pelo operador.
- **Cobertura total:** um JSON parcial, mesmo bem formado,
  não constitui um censo atualizado de todos os municípios.
- Diferenciar municípios, distrito federal, distrito estadual e
  outras categorias de geocódigos da base territorial do IBGE.
- Origem verificada não autoriza automaticamente páginas repetidas,
  slogans locais não comprovados, conteúdo de baixa qualidade
  ou indexação de páginas de municípios sem atendimento.

## Testes

    npm test

Valida UTF-8, sort, UF de hierarquias, recusa de alterações
suspeitas, milhares de linhas, arquivos locais seguros, criação
exclusiva, privacidade do console e ausência de publicação.

Sem chamadas Google/IBGE/CRM/Portal, sem merge/deploy e sem
mudanças na VPS, main, DNS ou indexação.
