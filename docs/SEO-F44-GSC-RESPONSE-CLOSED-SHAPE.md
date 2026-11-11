# SEO-F44 — Formato fechado de respostas GSC offline

O normalizador read-only recebe somente payloads sintéticos ou fornecidos manualmente. Rejeita quaisquer campos de primeiro nível além de `rows`, `responseAggregationType` e `metadata`; cada linha deve conter exatamente `keys`, `clicks`, `impressions`, `ctr` e `position`.

- Não aceitar flags forjadas de OAuth, tenant, autorização ou métricas experimentais.
- Ausência de campos obrigatórios nas linhas provoca erro, não preenchimento silencioso.
- Permanecem intactos os validadores de plano, período, propriedade, ordenação, duplicidade e agregação.
- Nenhuma chamada Google, credencial, coleta, escrita, merge em `main` ou deploy.

Teste: `npm test` Node 22/24 e posterior integração com o projeto Imagine Comercial antes de atualizar seu SHA pinado. A mudança é exclusivamente offline e permanece HOLD.
