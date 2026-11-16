# Imagine SEO RC64 — revisão cumulativa de regressão, editorial e migração

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Histórico de engenharia preservado

A RC64 continua a [RC63 #254](https://github.com/rafhael100/imagine-seo-engine/pull/254), que passou **48/48 workflows** na SHA `1bc47ee4d3708d403f5cf3b73fb1b39cdd5c29cc`. Preserva as entregas F159–F168, a integração Comercial F336 e os controles anteriores de SEO, segurança, GSC/Portal e revisão IBGE, sem merges.

Adiciona a [F169 #255](https://github.com/rafhael100/imagine-seo-engine/pull/255):
- Reutiliza o build Astro real de Comercial F335/F336 para comparar o inventário de URLs.
- Audita efetivamente HTML, sitemap, canonical e hreflang antes de revisar rotas com F22.
- Bloqueia desaparecimento de página sem candidato de redirect, página removida com candidato apenas sintático ou erro/aviso técnico novo.
- Não imprime URLs, HTML, queries, arquivos privados nem dados de cliente no relatório agregado.
- A F169 foi aprovada em seus **3/3 workflows**: testes Node 22/24, validação offline e integração com dois builds Astro reais.

## Gate específico da RC64

Executar **CI completa na HEAD da própria PR**, monitorar todos os jobs e não inferir aprovação da RC64 a partir das branches anteriores. Resultado verde não é GO. Nenhuma política de publicação pode ser alterada por uma contagem, comentário ou recibo autodeclarado.

## Impedimentos operacionais reais

1. **IBGE DTB 2025**: arquivo original ainda não autenticado com hash e fonte oficial independente (issue #230).
2. **Search Console por tenant**: OpenSEO conectado e leitura do domínio Imagine possível, porém o Imagine SEO Engine ainda não possui integração operacional consentida e isolada por empresa.
3. **Equivalência editorial e migração**: variantes históricas HTTP/WWW/EN-US vistas no GSC devem receber mapeamento 301 revisado, com equivalência de conteúdo e staging real.
4. **Conteúdo nacional**: páginas municipais só poderão ser publicadas com atendimento realmente confirmado, demanda comprovável, revisão de textos originais e origem territorial autenticada; não gerar milhares de doorway pages.
5. **Infraestrutura**: homologação isolada na VPS Leaseweb, segurança, TLS, quotas, backup/restauração e rollback reais.
6. **Aprovações**: revisão independente AppSec/SEO/LGPD/DBA e GO humano em etapa específica.

**Sem merge para main, deploy, alteração de DNS, indexação, pagamentos ou contato com dados de clientes. Decisão atual: HOLD.**
