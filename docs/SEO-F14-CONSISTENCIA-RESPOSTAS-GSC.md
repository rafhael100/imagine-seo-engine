# SEO-F14 — Validação de consistência das respostas Search Analytics

Requisitos do contrato remoto (documentação oficial):
https://developers.google.com/webmaster-tools/v1/searchanalytics/query

As respostas são analisadas localmente e **nunca** disparadas por este motor.

- O plano exige `type: web`, `dataState: final`, `aggregationType: byProperty`, dimensão única `query` e `rowLimit <= 25000`.
- Se a resposta informar `responseAggregationType`, ela deve ser `byProperty`; mudanças silenciosas são bloqueadas.
- `metadata.first_incomplete_date` ou `first_incomplete_hour` bloqueiam o processamento como dados finais.
- A paginação exige cliques em ordem não crescente, consistente com a ordenação documentada. Em empates, não presume ordem de consulta estável.
- Linhas que excedem 500 caracteres na chave de consulta são rejeitadas antes de acumular memória.

Limites: dados sintéticos, sem tokens, HTTP, credenciais, acesso à conta ou confirmação de propriedade. Mesmo uma resposta aparentemente completa pode conter apenas as principais consultas devido aos limites internos do Google.
