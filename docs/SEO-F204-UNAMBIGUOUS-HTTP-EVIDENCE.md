# SEO F204 — evidências HTTP sem cabeçalhos duplicados

## Falha comprovada

O objeto normalizado `IncomingMessage.headers` pode descartar duplicatas de `Location` e `Content-Type`. A verificação anterior de array no F138 nunca detectava esse caso. Nos GETs F142/F201, um primeiro MIME válido escondia um segundo cabeçalho conflitante.

Cinco regressões com HTTP real em loopback reproduziram o problema antes da correção: [CI da SHA 580b2dd5493140f7fa78c34e49859db3303d558c](https://github.com/rafhael100/imagine-seo-engine/actions/runs/44181259767). A suíte contém Location conflitante e repetido igual, mais Content-Type duplicado no HTML, robots e sitemap, com nomes em caixas diferentes e corpo exato.

## Comportamento corrigido

F138 usa `headersDistinct.location` e recusa mais de um valor antes da próxima consulta. F142/F201 exigem exatamente um `Content-Type`; ausências ou duplicidades seguem os códigos de bloqueio já existentes, sem emitir valores do cabeçalho ou conteúdo do site. Nenhum novo campo é acrescentado aos relatórios. O digest customizado F140 já recusa valores concatenados, pois exige 64 caracteres hexadecimais e igualdade exata.

A [documentação Node](https://nodejs.org/api/http.html#messageheadersdistinct) especifica que `headersDistinct` conserva cada valor em array e não aplica a junção/descarte do objeto normalizado. Compatível com as versões Node 22/24 adotadas.

Validação final e revisão estão na [PR #306](https://github.com/rafhael100/imagine-seo-engine/pull/306), baseada na correção de prazos #305. Preservados opt-in, destino loopback, limites de tempo/tamanho, privacidade e contratos de relatório.

## Limites

As evidências usam dados sintéticos e ambiente descartável. Não comprovam TLS/identidade real de staging, OAuth/GSC, homologação Leaseweb ou indexação. DRAFT / NO-GO / NO-MERGE / NO-DEPLOY. Nenhuma alteração em VPS, DNS, clientes ou produção.
