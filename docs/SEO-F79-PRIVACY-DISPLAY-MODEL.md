# SEO-F79 — Modelo interno de exibição com bloqueio por privacidade

## Objetivo
A função `prepareOfflinePortalQueryPageDisplayModel(input)` introduz um segundo contrato de revisão, **derivado exclusivamente de plano e páginas originais** pela revalidação SEO-F74/F72/F59. Um JSON agregado calculado pelo chamador não é aceito como evidência de dados ou autorização.

## Política de apresentação
- `SUPPLIED_BATCH_ONLY_UNVERIFIED`: permite métricas **somente para revisão técnica local**, com ressalva expressa de que não representa o tráfego total do Google; permissões de cliente/publicação continuam **falsas**.
- `REDACTED_ROWS_NO_SIGNALS`: expõe apenas o número de linhas recebidas e ocultadas; `analyzedRows`, `distinctQueries`, `queriesOnMultiplePages`, `pagesAcrossOverlappingQueries` viram `null`.
- `PARTIAL_BATCH_NO_SIGNALS`: oculta os mesmos indicadores para evitar inferências sobre uma consulta ainda incompleta.
- Qualquer dado privado de consulta, página, URL, fragmento ou token é descartado. `scope.sourceRevision` (40 caracteres hexadecimais) é informação de versão fornecida pelo operador, **não é assinatura** nem prova de origem autenticada.

Os testes de F79 cobrem estados normal, redacted, partial, duas páginas, escape de dados privados, saídas determinísticas, rejeição de artefatos calculados pelo cliente, falsificação de OAuth e revisão sem publicação.

## Limites operacionais
`customerDisplayAuthorized=false`, `backendTenantGrantVerified=false`, `oauthVerified=false`, `publicationAuthorized=false`, `networkPerformed=false`. Este modelo interno é **diferente de uma tela liberada a clientes**. O Portal futuro precisa demonstrar sessão/MFA válida, vinculação por tenant e propriedade GSC, OAuth consentido, isolamento de banco e aprovação AppSec/LGPD.

Sem chamadas Google, tokens, credenciais, persistência, 301, publicação, faturamento, merges em main ou deploy. Próxima integração candidata: validar compatibilidade desse novo contrato com o painel PHP do Portal em laboratório antes de usar dados reais.
