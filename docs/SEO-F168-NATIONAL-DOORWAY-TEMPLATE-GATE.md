# SEO F168 — conferência nacional de páginas com texto copiado trocando a cidade

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Continua a [F167 #250](https://github.com/rafhael100/imagine-seo-engine/pull/250).

## Problema resolvido

O filtro F107 compara até 25 novos rascunhos com 250 páginas existentes. O inventário F108 compara SHA de textos idênticos mas não detecta, sozinho, o mesmo corpo reaproveitado trocando **Fortaleza, CE** por **Recife, PE**. A F168 executa uma checagem conservadora de *templates por substituição de cidade* sobre até 6.000 entradas originais fornecidas pelo operador, inclusive de diferentes lotes.

## Entrada privada

Arquivo JSON com exatamente `sourceType: operator_supplied_private_editorial_text_unverified` e `entries`; cada entrada inclui apenas `serviceSlug`, `ibgeCode`, `city`, `state`, `locale` e `localContent`. Tamanho máximo de conteúdo por página 8.000 caracteres e teto agregado de 20 milhões de caracteres. O CLI exige arquivo regular local com permissão `0600` em POSIX e recusa symlinks e dados fora do limite.

Execução exclusiva do operador autorizado:

`node scripts/review-national-city-templates-offline.mjs /caminho/privado/inventario.json`

A saída inclui índices limitados, códigos fixos e contagens de colisões, sem cidade, UF, IBGE, texto, URL, identificador, hash nem dados de clientes. O código de saída é não-zero quando há textos padronizados por cidade ou duplicidade do mesmo município/serviço/idioma.

## Método

O módulo normaliza Unicode, caixa, pontuação, nomes de cidade e combinação cidade+UF no texto. Compara resumos internos SHA-256 de corpos normalizados para identificar **templates idênticos após substituição**. Também detecta repetição de `ibgeCode + serviço + idioma` no inventário. Testes de laboratório usam cidades e textos sintéticos.

## Limitações

Esta **não é** análise semântica, detecção de conteúdo quase igual com parágrafos alterados, auditoria de disponibilidade do serviço, comprovação de demanda, origem oficial IBGE, nem prova de inventário nacional completo. A ausência de colisões não aprova publicações ou indexação. Outras medidas editoriais F107–F110, autenticação IBGE/DTB, revisão humana e política antidoorway continuam exigidas.

Nenhuma página é gerada, indexada ou publicada e a rotina não realiza chamadas externas.
