# Seleção do grupo Googlebot no robots.txt

## Problema observado

O F213 detecta bloqueios de caminhos públicos, mas selecionava grupos de
Googlebot somente quando o valor de `User-agent` era exatamente `googlebot`.
Com o exemplo abaixo, o auditor aceitava as duas páginas sintéticas sem erro
ou aviso, apesar do bloqueio do serviço para o Googlebot geral:

```text
User-agent: *
Allow: /

User-agent: Googlebot/2.1
Disallow: /servicos/
```

`Googlebot*` produzia o mesmo resultado. A direção inversa também falhava:
um `Allow: /` específico com um desses sufixos era ignorado e o auditor usava
o `Disallow: /` do grupo global.

## Correção

A seleção compara o token de produto inicial do campo, composto por letras,
underscore e hífen, ao valor `googlebot`. O tratamento permanece sem distinção
entre maiúsculas e minúsculas. Sufixos que não pertencem ao token, como `/2.1`
ou `*`, deixam de ocultar o grupo aplicável.

O reconhecimento não procura `googlebot` em qualquer posição. Tokens como
`Googlebot-Image`, `Googlebot-News`, `Googlebot_Extra` e `OtherGooglebot`
continuam distintos. Grupos específicos equivalentes são combinados e
prevalecem sobre o grupo global, conservando a resolução de `Allow` em empate.

A correção altera somente a seleção dos grupos. Os limites de leitura e
linhas permanecem iguais. Caminhos com curingas, âncoras, encoding, query ou
Unicode continuam sujeitos ao aviso `robots_pattern_manual_review`; a
mudança não apresenta o auditor como uma implementação completa do REP.

## Validação comportamental

`tests/robots-user-agent.test.mjs` contém 15 casos: dez reproduzem falhas na
revisão anterior e cinco controlam a separação de outros tokens. Os casos
cobrem bloqueios de raiz e serviço, `Allow` específico sobre wildcard,
combinação de grupos, empate de `Allow`, grupos com múltiplos agentes,
maiúsculas/minúsculas e preservação do aviso de caminhos complexos.

Na execução local da correção, os 113 testes focados e os 1.121 testes da
suíte completa passaram, sem falhas, cancelamentos ou skips. Os resultados
de CI devem ser conferidos no commit publicado da PR antes da integração.

As entradas são sintéticas e temporárias; nenhuma chamada HTTP, propriedade
Search Console ou dado de cliente participa dos testes. O resultado verifica
o artefato local e não demonstra indexação ou ranking em produção.

## Fontes primárias

- [Interpretação do robots.txt pelo Google — precedência de agentes](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec#order-of-precedence-for-user-agents): descreve a equivalência dos exemplos `googlebot/1.2` e `googlebot*` com o Googlebot geral, a combinação de grupos aplicáveis e sua separação do grupo global.
- [RFC 9309, seção 2.2.1](https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1): define os caracteres do token de produto e a seleção de grupos sem distinção de caixa.

Branches isoladas e PRs draft permanecem obrigatórias; esta correção não
publica o site, não altera DNS ou robots.txt na origem e não autoriza merge.
