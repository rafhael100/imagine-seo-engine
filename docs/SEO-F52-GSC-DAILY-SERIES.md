# SEO-F52 — Séries diárias do Search Console, somente offline

O `analyzeOfflineGscDailySeries` processa respostas **fornecidas ao programa** na dimensão `date` e retorna série temporal segura, total de cliques/impressões, CTR recalculado, posição média ponderada e contagem de dias ausentes, sem inventar observações nulas nos dias não retornados. Rejeita datas impossíveis, fora do intervalo ou duplicadas; métricas inconsistentes, campos extras, marcadores de período incompleto e mudanças do contexto de empresa/propriedade.

Aceita somente o modo `byProperty` (quando informado), período de até 92 dias e limite por página de no máximo 92 linhas. As datas fornecidas são tratadas como dias civis UTC para integridade do calendário; **Google reporta datas de propriedade conforme Search Console** e não há relógio ou contato com a API neste módulo.

O acesso real `https://www.imaginecomunicacao.com.br/` foi confirmado via conexão separada do OpenSEO em novembro de 2026, mas **isso não autentica o Portal nem o mecanismo SEO**. Todos os retornos da F52 continuam `HOLD`, com `oauthVerified`, `tenantGrantVerified`, `productionReadAuthorized` e `networkPerformed` falsos. A CI usa apenas dados sintéticos. Não colocar resposta real ou termos de pesquisa no repositório/CI. Sem deploy, OAuth, segredos, gastos ou alterações de produção.
