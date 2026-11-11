# SEO-F13 — Detecção de mudanças em URLs de sites estáticos

A auditoria passa a exportar `routes` (caminhos públicos dos HTML efetivamente processados). Esse campo permite comparar a publicação atual com a anterior mesmo que o total de páginas permaneça igual.

A função `compareStaticAuditReports` mantém compatibilidade com relatórios mais antigos e adiciona:
- `removedRoutes`, `addedRoutes` e contagens;
- `routeInventoryCompared` e `routeInventoryRegressed`;
- política `blockRouteLoss: true` por padrão, protegendo URLs removidas sem aprovação.

Exemplo: excluir `/servicos/` e acrescentar `/promocoes/` mantendo 2 páginas agora reprova o gate. Isso não prova impacto de ranking; a revisão precisa distinguir migração legítima de perda acidental e avaliar redirecionamentos 301 no servidor.

**Limitações:** somente caminhos de HTML local, sem crawler HTTP, sem conferência de 301 da hospedagem e sem integração direta ao GitHub Actions do Comercial. Não publicar automaticamente.
