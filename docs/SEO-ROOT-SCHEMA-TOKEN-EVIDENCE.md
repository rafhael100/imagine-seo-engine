# Evidência lexical de HTML, JSON-LD e atributos hreflang

## Defeitos reproduzidos

A identificação da raiz HTML e dos scripts JSON-LD ainda aplicava expressões
regulares sobre o documento inteiro. O guard de hreflang também contava
atributos por regex dentro de valores entre aspas. Três grupos de falhas foram
comprovados no auditor completo, com conteúdo exclusivamente sintético:

- Um `<html lang='pt-BR'>` literal dentro de atributo podia aprovar uma raiz
  sem idioma. Um `>` dentro de atributo anterior ao `lang` real truncava a
  leitura, produzindo falso alerta. O problema também afetava a seleção
  multilíngue e podia simular um segundo atributo `lang`.
- Um SCRIPT aparente em atributo ou textarea podia satisfazer a presença de
  JSON-LD, produzir erro de JSON indevido ou consumir o orçamento de scripts.
  O nome `data-type` e uma atribuição `type=` dentro de texto entre aspas podiam
  fingir o tipo do SCRIPT. Um `>` no atributo real podia esconder o `type` ou
  contaminar os bytes JSON analisados.
- Atribuições `href=`, `hreflang=` ou `rel=` literais dentro de `data-example`
  podiam simular duplicatas e rejeitar uma tríade PT/EN/ES válida. Um RSS sem
  idioma real, mas com exemplo de `hreflang` em texto, virava um candidato falso
  e podia esgotar o orçamento de alternates.

## Correção e limites preservados

`extractRootHtmlLanguages` seleciona o primeiro HTML real pelo lexer e lê
somente seus atributos efetivos. `iterateJsonLdScriptTexts` seleciona somente
SCRIPT real, com fechamento, cujo primeiro atributo `type` real e entre aspas
declara `application/ld+json`. Seu corpo é delimitado pelas posições da abertura
completa e do fechamento, preservando bytes JSON entre eles.

A leitura de atributos reaproveita o parser lexical existente. A validação
específica de META/LINK/BASE mantém o limite de 128 atributos, a rejeição de
duplicatas críticas e a decodificação limitada. HTML e SCRIPT não recebem esse
limite distinto, ausente em seus leitores anteriores; continuam sujeitos ao
limite global de HTML e ao orçamento de tokens. O limite de 128 scripts JSON-LD
por página permanece, agora consumido somente por scripts reais elegíveis.

Os atributos `lang` e `type` continuam exigidos entre aspas, sem nova
decodificação de entidades. Duplicatas de `lang` não satisfazem o contrato de
um único idioma. São preservados os diagnósticos existentes, a leitura de
JSON-LD no BODY e a análise de sintaxe JSON. BASE continua em revisão explícita.

`strictHreflangLink` passa a usar a mesma leitura de atributos reais, exigindo
uma única ocorrência entre aspas de cada atributo obrigatório. Valores de
entidades continuam literais nessa verificação estrita; a decodificação
limitada do HEAD permanece uma verificação separada. O limite de 16 links
hreflang por página não muda, e RSS sem atributo hreflang real não o consome.

## Evidência de regressão

Na base [Engine #319](https://github.com/rafhael100/imagine-seo-engine/pull/319),
SHA `9c9e9c18629c3ee672ee92686d0c69c3f122dcf2`, o conjunto inicial de 22 casos
produziu **14 falhas reproduzidas e oito controles aprovados**. Um controle
adicional garante que 129 atributos irrelevantes em HTML/SCRIPT não introduzam
o limite próprio de META por efeito da reutilização do parser. A rodada
seguinte, ainda antes da correção do guard hreflang, produziu **cinco falhas e
quatro controles aprovados em nove casos adicionais**. Esses controles
preservam a política literal de entidades e o bloqueio de 17 alternates reais.

Após a correção, **32/32 casos novos**, **213/213 testes focados** e
**1.101/1.101 testes da suíte completa** passaram, sem falhas, cancelamentos ou
skips. Os testes focados abrangem também TITLE, H1, metadados ambíguos,
fronteiras explícitas HEAD/BODY, navegação inerte e a suíte geral do auditor,
incluindo recusa de atributos hreflang duplicados ou sem aspas.

Nenhuma chamada externa, credencial ou dado de cliente participa desta prova.
O lexer permanece estático: não reconstrói o DOM, não executa JavaScript nem
reproduz toda a recuperação de HTML malformado de um navegador. A candidata
precisa de CI própria antes da promoção do pin no Comercial; resultados locais
não demonstram indexação, ranking, deploy ou funcionamento em produção.
