# SEO F160 — inventário do diff cumulativo RC60

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

## Objetivo
Revisar de forma reprodutível o diff completo acumulado entre a base `main` imutável da RC60 e a HEAD candidata atual. O inventário separa alterações relacionadas a cadeia de CI/supply chain, identidade e segurança, infraestrutura, origem territorial/editorial, integrações, testes, documentação e demais arquivos.

O marcador `criticalReviewPaths` indica quantidade de caminhos que merecem atenção prioritária, **não significa que os demais são seguros**. Nenhuma categoria aprova o diff automaticamente.

## Execução técnica
- Base imutável pré-RC60: `abd9dbff0cf36a9f754e76e23b6825d6cc1c35fd` (SHA `main` observada na PR RC60 #235).
- `git merge-base --is-ancestor` exige ancestralidade real; `git diff --name-only --diff-filter=ACMRT -z` percorre todos os caminhos sem parse incorreto de espaços.
- A rotina F160 não efetua chamadas de rede nem lê conteúdo de clientes. Recebe somente os caminhos provenientes do checkout local.
- Rejeita caminhos vazios, duplicados, absolutos, traversal, separadores estranhos e controles.
- Saída limitada a contagens, estado HOLD e proibições explícitas de `merge`, `deploy` e `publication`.

## Limitações e próximas verificações
O inventário **não é revisão independente de código**, não valida CVEs, permissões GitHub, cadeia de dependências, segredo em commit ou legalidade editorial. Esses exames continuam obrigatórios para os arquivos enumerados, especialmente workflows e infraestrutura.

Não comprova origem IBGE/DTB, autenticação GSC por tenant, testes reais na VPS Leaseweb, rollback, consentimento LGPD ou aceite de publicação.

A revisão deve ocorrer a partir do diff real na [RC60 #235](https://github.com/rafhael100/imagine-seo-engine/pull/235) e da integração [F159 #237](https://github.com/rafhael100/imagine-seo-engine/pull/237). Nenhuma mudança de `main`, VPS, domínio ou dados operacionais é feita por esta entrega.
