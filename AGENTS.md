# AGENTS — Imagine SEO Engine

## Objetivo
Motor SEO independente (P1), inicialmente dedicado à melhora orgânica e conversão do site comercial Imagine (P0). Possível produto/serviço comercial futuro. Não compete por prioridade com o desenvolvimento do site comercial.

## Segurança e limites
- Nunca buscar/salvar tokens Google, dados reais de clientes, contas de anunciantes ou dados fiscais sem integração autorizada e regras LGPD/tenant.
- Testes sintéticos não equivalem a ranking real, rastreamento ao vivo ou conformidade de um site em produção.
- Não gerar milhares de páginas de municípios sem evidência e aprovação: evitar doorway/scaled content abuse.
- Nunca realizar scraping agressivo, consultar endpoints privados, alterar sites terceiros sem permissão, publicar, comprar API, mudar domínio, efetuar merge main ou deploy automático.
- Isolar clientes e chaves quando houver backend multiempresa; por enquanto as bibliotecas são somente offline.

## Comandos e arquitetura
- `npm test`: auditor e oportunidade Google com dados sintéticos.
- `node scripts/audit-dist.mjs <diretório-estático>`: HTML, canonical, indexação, links, schema, sitemap, robots.
- `node scripts/report-gsc-offline.mjs <export-autorizado.json>`: agrupamento limitado de palavras-chave; nunca posições exatas.
- A aplicação comercial executa a versão pinada do auditor no GitHub Actions.

## Prioridades seguintes
1. Melhorar auditor a partir de bugs observados em builds sintéticos, com limites de segurança e testes.
2. Integrar ao site por contratos read-only e sem segredos.
3. Conexão OAuth/GSC só após autorização da propriedade e conformidade LGPD.
4. Projetar fila, observabilidade, tenant isolation e relatórios comerciais no Portal.
5. Expandir com revisão editorial e dados originais, sem promessa de primeiro lugar.
