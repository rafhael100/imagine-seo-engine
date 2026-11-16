# SEO F128 — conferir destinos 301 no HTML realmente compilado

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F127 #184](https://github.com/rafhael100/imagine-seo-engine/pull/184). Integração somente offline; não gera regras para Cloudflare/Nginx, não usa DNS, não executa HTTP e não publica.

A F127 comprova que uma proposta de migração HTTP/www e caminhos `/en-us/` aponta para rotas declaradas do novo site. Isso não prova que essas rotas estejam presentes em um build. A F128 aplica **`auditStaticSite` ao diretório real de HTML compilado**, com `strictPublicHead` e validação de idioma/hreflang habilitados, e confirma cada destino declarado na lista de rotas do HTML auditado.

Rejeita página-alvo ausente, conteúdo privado incluído no build, erro técnico de canonical/robots/sitemap, página não incluída no sitemap e falha F127 (URL sem mapeamento, destino de idioma incorreto, open redirect, loop). A saída conserva somente contagens e índices das rotas ausentes — nunca URLs, consultas, códigos municipais ou textos.

A API local `reviewCompiledLegacyRedirectTargets({planInput,buildDirectory})` exige um manifesto F127 verificado antes de analisar arquivos. Seu status de sucesso permanece **`human_independent_redirect_review_required`**, não `ready-to-deploy`: a presença do destino compilado não comprova serviço realmente implantado, resposta HTTP 301 em produção, relevância equivalente, backlinks ou indexação.

## Testes

Node 22/24 usa HTML real gravado em diretórios temporários, páginas PT/EN, sitemap e robots: caso positivo, inglês ausente, página editorial privada indevida, página fora do sitemap, spoofing de autoridade e domínio divergente. O módulo não realiza nenhuma solicitação externa.

## Gates para homologação

- Cruzar relatório com URLs reais mantidas em fonte privada e obter equivalência editorial humana, especialmente caminhos `/en-us/` migrando para `/en/`.
- Comparar a lista completa de redirects com `robots.txt`, sitemaps, canonical e hreflang da versão futura do Imagine Comercial.
- Fazer testes 301/308 reais, detectar loops e cadeias e confirmar respostas do host www/apex somente em staging autorizado.
- Registrar snapshots de DNS/Cloudflare e configurações, backups/restauração, validações SEO e rollback antes de qualquer publicação.

**O tráfego real consultado do GSC permanece fora deste repositório público.**
