# Imagine SEO RC62 — consolidação completa para revisão de release

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

## Escopo incremental sobre RC61

- Preserva as entregas F159–F164 e a correção Comercial F336 por SHA fixa.
- Incorpora a F165 (PR #247), que reuniu as PRs independentes #233, #238, #239 sem merges, cobrindo bloqueio de builds com zero páginas, integridade de rotas auditadas, classificação de sitemap/hreflang e preservação dos contratos Portal.
- RC61 #246 passou **46/46 workflows** na HEAD `990d830349c8c53beb30060c71c6e300fd6440db`, mas essa evidência **não equivale a CI da RC62**.
- F165 #247 passou no workflow offline na HEAD `05e605209e21a59ceb7a8fc8a61ee413f9002e94`. Exigir nova CI na SHA final RC62.

## Verificações de release sem atalhos

1. Conferir integração cumulativa e inventário real de mudanças, sobretudo arquivos de segurança/CI/infraestrutura e relatórios para Portal.
2. Validar build Astro e Chromium da versão Comercial F336 na mesma SHA imutável.
3. Verificar que nenhuma auditoria com zero páginas, rotas falsas ou achados de SEO não classificados seja apresentada ao cliente como saudável.
4. Obter e autenticar a base territorial DTB/IBGE oficial com recibos independentes; issue #230 continua bloqueada.
5. Revisar conteúdo útil local, evitar doorway, homologar propriedade GSC por tenant com autorização; nenhum dado sintético pode aparecer como medição real.
6. Inspecionar staging Leaseweb real com isolamento, firewall, TLS, recursos, backups/restauração, rollback e revisão independente.
7. Registrar aceites AppSec/SEO/LGPD/DBA e decisão humana separada de publicação. O contrato F162 permanece `publicationAuthorized=false` por definição.

**Estado de saída da candidata: HOLD**, mesmo que a CI esteja verde. Nenhum merge, DNS, deploy, indexação ou integração real de dados foi autorizado por este documento.
