# SEO-F22 — Migração de URLs sem aprovação automática
`reviewStaticRouteMigration({before,after,candidates})` é um contrato **somente de revisão** para futuros planejamentos de migração.
- Origem: inventários de `routes` do auditor estático, gerados localmente.
- Candidatos: pares exatos `{from:'/antiga/',to:'/nova/'}`, sem metadados de autoridade.
- Destinos devem existir no novo inventário. URLs externas, queries, fragments, percent-encoding, duplicatas e rotas ausentes são recusadas.
- A saída omite rotas individuais e informa apenas totais e HOLD. `deploymentAuthorized` é permanentemente `false`; `appliedRedirects` é `0`.
- O CLI devolve status 1 sempre que houver URLs removidas, mesmo com cobertura perfeita, para exigir decisão externa.
- A validação local **não substitui** status HTTP, backlinks, Search Console, análise semântica 1:1, revisão editorial/legal nem homologação real de redirecionamentos 301.
