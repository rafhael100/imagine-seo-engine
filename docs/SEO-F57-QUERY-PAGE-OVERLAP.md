# SEO-F57 — Revisão de consultas associadas a múltiplas páginas (offline)

O módulo `reviewOfflineGscQueryPageOverlap` recebe dados Search Analytics dimensionados por `query,page`, fornecidos ao programa (sem OAuth, sem rede). Exige empresa, propriedade canônica, fingerprint SHA-256 coerente, período válido, formato estrito `byPage`, limites de linhas e métricas numéricas consistentes.

A análise identifica quantas consultas **não sensíveis** apareceram em duas ou mais páginas da mesma propriedade, quantas associações página-consulta foram observadas e quantas impressões elas somam. Não retorna consultas brutas, URLs, hashes reversíveis ou detalhes por cliente. E-mails, telefones e padrões de documento são excluídos da análise.

**Importante:** duas páginas posicionarem para uma mesma consulta é apenas um indício que pode exigir revisão editorial; não comprova canibalização, erro de canonical ou que uma página deve ser redirecionada. Paginação completa não é inferida sem prova: quando há quantidade máxima de linhas, o status mantém `PARTIAL_COVERAGE_REVIEW_ONLY`.

O Google Search Console conectado ao OpenSEO continua independente deste módulo. CI usa apenas páginas e consultas fictícias; nenhuma exportação real vai ao repositório. A saída sempre mantém OAuth, autorização de tenant, exibição, operação de rede e publicação como falsas, com `HOLD_EXTERNAL_BACKEND_VERIFICATION`. Sem deploy, merge na `main` ou alteração de DNS.
