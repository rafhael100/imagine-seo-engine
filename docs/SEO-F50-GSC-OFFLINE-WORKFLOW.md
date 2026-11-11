# SEO-F50 — Fluxo offline de revisão GSC para futura integração Portal

A função `reviewOfflineGscReadiness` conecta preflight de propriedade, binding estrito do plano de consultas e análise de respostas paginadas **fornecidas pelo operador**, tudo em memória. Se a propriedade declarada está ausente ou sem nível declarado de leitura, o fluxo retorna bloqueio e não processa linhas. Se há correspondência sintática, retorna apenas contadores agregados e metadados seguros, sem termos brutos.

Os resultados sempre declaram OAuth, grant de empresa, consentimento, exibição a clientes e produção como **não verificados ou não autorizados**. Mesmo em caso positivo, o resultado é exclusivamente `OFFLINE_REVIEW_ONLY` com `HOLD_EXTERNAL_BACKEND_VERIFICATION`.

Testes sintéticos verificam isolamento de contexto, falsificação de plano, privacidade e negação. Não há chamadas Google, credenciais, dados reais, publicação, deploy, custos ou merge na main.
