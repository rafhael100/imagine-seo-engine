# SEO-F3 — Grafo de links internos em builds HTML locais

## Problema
Sitemaps e rotas válidas não garantem que o visitante ou o robô encontre cada página a partir da homepage. Links internos consistentes são fundamentais para o site comercial crescer com conteúdos e novos serviços.

## Implementado
- A auditoria estática gera um **grafo orientado de links internos** extraídos das páginas HTML produzidas.
- Identifica páginas sem nenhum link interno de entrada (`orphan_page`), páginas não alcançáveis por navegação desde a homepage (`unreachable_page`) e páginas que precisam de mais de três cliques (`deep_page`).
- Registra métricas resumidas: total alcançável, inacessível por links, maior profundidade e quantidade órfã.
- Os resultados são apenas **avisos**: não declarar problema de indexação garantido nem mudar automaticamente sitemap ou títulos.
- Testes sintéticos exercitam conteúdo órfão, páginas profundas e homepage com link para si mesma.
- Biblioteca local, sem rede, crawling externo ou dados de clientes.

## Limites e próximos passos
A análise usa links visíveis no HTML compilado (não renderiza JS, páginas SPA, canonical externa, navegação escondida por login ou redirects de produção). Para validar a navegação real, combinar com Playwright, Lighthouse e Google Search Console autorizado.

O **Imagine Comercial** é o primeiro consumidor do auditor através de SHA fixo no CI. Atualizar o commit pinado somente depois de validação independente.

Sem merge em main, deploy ou ferramentas pagas.
