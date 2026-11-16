# SEO-F41 — Plano GSC restrito e período revalidado

Uma validação que apenas confere alguns campos conhecidos de um plano de API pode ignorar novos parâmetros inseridos por uma origem não confiável, como `dimensionFilterGroups` ou `searchType`, que alterariam a consulta se a camada de HTTP enviasse o corpo inteiro. Datas adulteradas poderiam passar sem revalidação.

O novo gate limita os campos de primeiro nível e do corpo a uma lista estrita, recusando qualquer outro campo, e volta a verificar o período de até 92 dias, respeitando calendário real, ordem e formato. Também exige consistência entre propriedade declarada e tamanho do inventário.

Não realiza HTTP, não persiste dados e nunca autoriza OAuth, grants do Portal ou produção. Backend autenticado ainda deve repetir a validação antes de enviar uma consulta real.
