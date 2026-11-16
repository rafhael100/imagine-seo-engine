# SEO F110 — conferência de municípios, UF e nomes em referência local

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continuação da [F109 #156](https://github.com/rafhael100/imagine-seo-engine/pull/156).

## Objetivo

Apenas ter sete algarismos no código do município não comprova
correspondência à localidade ou à UF. A F110 compara os códigos
das páginas municipais com uma **referência local fornecida pelo
operador**, preservando os controles das F107–F109.

A estrutura oficial de geocódigos do IBGE utiliza prefixo de UF
e código municipal de sete algarismos. Como referência de revisão,
consulte:
https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15774-malhas.html

**Importante:** o programa não acessa nem autentica o IBGE. O
arquivo fornecido pode estar desatualizado ou incompleto. Uma
comparação bem-sucedida NÃO comprova origem oficial.

## Formato dos arquivos

A F110 consome três arquivos locais:

1. Entrada original F107, até 512 KiB: rascunhos editoriais
2. Entrada original F108, até 10 MiB: inventário municipal
3. Referência, até 2 MiB, com estrutura:

    {
      "sourceType": "operator_supplied_municipality_reference_unverified",
      "entries": [
        {"ibgeCode":"2304400","state":"CE","city":"Fortaleza"},
        {"ibgeCode":"2611606","state":"PE","city":"Recife"}
      ]
    }

A referência aceita até 6 mil municípios. **Esses dois registros
são apenas exemplos**, não um diretório completo. É responsabilidade
do operador obter um recorte oficial atualizado e conferir sua
integridade/procedência antes de declarar que é referência nacional.

## Execução offline

    node scripts/reconcile-geo-reference-offline.mjs private-drafts.json private-inventory.json private-municipalities.json

## Validações

- Reprocessa a F109, sem confiar em alegações de aprovação anteriores.
- Confere prefixo UF no código de sete algarismos.
- Verifica código, UF e nome da cidade em referência fornecida
  (com comparação de nomes indiferente a maiúsculas e acentos).
- Detecta códigos duplicados ou prefixos incorretos no próprio
  arquivo de referência.
- Examina os registros do inventário amplo, reportando quantidade
  de códigos sem referência ou com UF divergente.
- Mantém confidenciais o município, nome, URL, conteúdo e digests;
  a resposta contém apenas índices, códigos de impedimento e totais.

Um município não encontrado em uma referência incompleta é marcado
como "não consta na referência fornecida", **não** como inexistente
em todo o país. Nenhum resultado permite publicação automática.

## Gates para a operação real

- Obter versão oficial e completa da malha municipal e registrar data,
  origem e integridade do arquivo, com controle de atualizações.
- Diferenciar municípios, Distrito Federal, distrito estadual e áreas
  operacionais que possam constar em bases de geocódigos.
- Auditar identidade de cada serviço, conteúdo editorial original,
  cobertura de atendimento e demanda real antes de indexar páginas.
- Homologar Portal/Sites/SEO, backups/rollback, SEO, LGPD e release.

Testes automatizados:

    npm test

**Sem conexões de rede, API Google, IBGE em tempo real, CRM, VPS,
mudanças na main, publicação ou deploy.**
