# SEO-F0 — Auditoria estática local

- CLI: `node scripts/audit-dist.mjs caminho/para/dist https://imaginecomunicacao.com.br/`.
- Inspeciona **arquivos locais**: título, meta description, H1, canonical, robots, JSON-LD, sitemap, URLs internas e respostas do bundle *inferidas* (não faz requests HTTP).
- Emite JSON com erros e avisos e retorna exit code 1 quando encontra erros de auditoria.
- 404.html é omitido dos índices de páginas indexáveis.
- Protege contra symlinks e arquivos HTML maiores que 2 MiB e limita 20 mil páginas (parâmetros de segurança iniciais).
- Sem acesso ao Google, sem ranqueamento inventado, sem token, sem scraping e sem edição/publicação de páginas.
- Regex do HTML cobre elementos previstos nos builds Astro; não substitui um parser HTML completo, navegador real, Lighthouse, Search Console ou ferramenta de acessibilidade.

## Integração planejada
O Imagine Comercial poderá executar este auditor após seu build e publicar o JSON como artefato de CI, usando uma **versão revisada e fixa** do motor, sem acessar dados reais de clientes. A contratação de serviços SEO permanece no Portal. O primeiro cliente do motor será o próprio site da Imagine.

## Política
PR draft, nunca merge/deploy automático. Não concluir homologação de SEO com base apenas no auditor. Prioridade P1 subordinada ao desenvolvimento do site comercial.
