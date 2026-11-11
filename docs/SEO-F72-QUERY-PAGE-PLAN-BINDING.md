# SEO-F72 — Vinculação de lotes GSC ao plano F71

`reviewOfflineGscQueryPagePlannedBatch({plan,pages})` valida o formato **exato** do blueprint F71, reconstrói internamente o plano a partir da propriedade HTTPS ou `sc-domain:` do endpoint e confere endpoint, fingerprint, tenant, período, escopo, dimensões, método, flags falsas e limites. Não aceita token, campos extras, permissões falsas ou plano adulterado.

Exige lote começando em offset zero e encaminha até quatro páginas originais à F59/F63, que revê offsets, consistência, duplicatas, métricas e truncamento. A saída mantém somente indicadores, sem strings brutas de consultas, páginas, URLs ou credenciais. Todas as permissões continuam negadas.

**Não comprova propriedade, usuário ou OAuth.** A identidade do tenant é declarada no arquivo offline e terá que ser vinculada pelo backend autenticado do Portal antes de qualquer consumo real.

Testes sintéticos cobrem plano válido, duas páginas, adulteração de URL, campos de autorização, dimensões e offsets. Sem HTTP, dados de clientes em Git/CI, deploy, DNS ou merge `main`.
