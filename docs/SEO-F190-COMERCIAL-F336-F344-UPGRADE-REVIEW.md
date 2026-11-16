# SEO F190 — regressão real Imagine Comercial F336 → F344

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Lacuna corrigida

O SEO F167 realiza uma auditoria funcional comparativa entre dois builds imutáveis do Comercial (F335 → F336). A integração mais recente F186/F187 já usa o Comercial F344, mas **o candidato F344 não tinha sido comparado diretamente à versão F336 nos gates de regressão de rotas/SEO existentes**. Uma modificação no formulário anônimo, no atendimento ou nas páginas multilíngues poderia degradar canonical, hreflang, sitemap ou navegação sem aparecer na comparação antiga.

## Nova CI integrada (apenas engenharia)

O workflow `.github/workflows/seo-f190-comercial-f344-upgrade-ci.yml`:
1. Faz checkout e confirma a SHA **F336** `0fb80e9ea0335c6ee5dd834c63148d58e5c9ff38`.
2. Faz checkout e confirma a SHA **F344** `873815411236ea6f0b333c5826661f177a5ad0c0`.
3. Instala dependências de lockfile e compila os **dois builds Astro reais**.
4. Executa os testes nativos F344 e `check:dist`.
5. Reutiliza o comparador F162/F166 para detectar novas categorias de falha de SEO e mudança de inventário; também usa F169 para recusar desaparecimento não aprovado de rotas.
6. Instala Chromium pelo Playwright da própria aplicação F344 e executa `test:browser` nas jornadas anônimas PT/EN/ES.
7. Verifica que os repositórios checkout não receberam mudanças rastreadas.

O workflow não depende de OAuth, leads ou clientes reais. Não publica páginas, escreve anúncios, altera DNS ou aplica deploy.

## Critérios e interpretação

- Comparação verde significa apenas ausência de regressões de famílias de erro identificadas pelo auditor e aprovação do navegador naquelas SHAs.
- Novas páginas ou rotas removidas são classificadas como **mudança de inventário** e exigem revisão editorial e de migração separada, mesmo que o sistema continue tecnicamente funcional.
- Nenhum teste de laboratório comprova que Google indexou páginas, que o Portal concedeu acesso a um tenant, que pagamentos funcionam na produção ou que a VPS Leaseweb responde com TLS e HTTP 301 corretos.
- Falha não autoriza ignorar testes ou editar o inventário para ocultar rota ausente; diagnosticar a diferença e exigir aprovação explícita de migração antes de atualizar os pins.

Continua a [RC71 #283](https://github.com/rafhael100/imagine-seo-engine/pull/283) e mantém o status HOLD para revisão independente AppSec/LGPD, GSC por tenant, homologação Leaseweb com backup/restauração/rollback e decisão humana GO.
