# SEO-F11 — Paginação segura de respostas GSC offline

`analyzeGscPaginatedResponses(pages,plan)` aceita páginas de resposta **fornecidas** a partir de um plano SEO-F10. Não faz requisições.

- Exige página inicial no offset 0 e offsets sucessivos de acordo com `rowLimit`.
- Rejeita lacunas, duplicações de consulta, páginas intermediárias incompletas, mais de quatro páginas ou mais de 50 mil linhas (limites locais conservadores e configuráveis para baixo).
- Valida cada linha na análise de oportunidades, filtra possíveis informações pessoais e retorna só métricas agregadas.
- Sinaliza quando a última página recebida está cheia e pode existir mais dados; alerta sempre que o Google pode omitir linhas anonimizadas.
- Metadados de empresa e propriedade são declarações offline, não prova de autorização.

Integração ao Portal, OAuth, rate limits, filas, consentimento e armazenamento seguro ainda exigem implementação e autorização operacional. Não incluir dados reais em testes ou logs.
