# Imagine SEO RC49 — GSC origens históricas × migração 301 (revisão integrada)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [RC48 #189](https://github.com/rafhael100/imagine-seo-engine/pull/189) e das entregas [F131 #191](https://github.com/rafhael100/imagine-seo-engine/pull/191), [F132 #192](https://github.com/rafhael100/imagine-seo-engine/pull/192), [F133 #193](https://github.com/rafhael100/imagine-seo-engine/pull/193).

## Entregas funcionais

- RC47–RC48: migração 301 HTTP/www/en-us, equivalência de idioma, destinos conferidos em HTML compilado, script de homologação local, e auditoria de configuração GA4 do funil Visitas → Leads → Clientes (sem números reais nem ativação de eventos).
- F131: auditoria offline da origem das páginas de uma **propriedade de domínio GSC** (apex HTTPS, outras variantes HTTP/www/subdomínios); nenhuma URL da fonte sai do módulo.
- F132: execução local privada com arquivo regular, UTF-8 estrito e limites de leitura; resultado sanitizado e códigos 0/1/2, sem chamar Google.
- F133: compara as URLs legadas **observadas no insumo GSC** com o inventário 301 F127; bloqueia URLs sem mapeamento, subdomínios fora do escopo, dados privados, paginação incompleta e fonte/host divergentes.
- A linha RC46 conserva os contratos Ed25519 v2 e auditoria PT/EN/ES, validados em laboratório com o Portal RC50; o contrato antigo F121/v1 segue intacto.

## Evidências CI verificadas

- F131: Node 22/24 e validação geral, ambos **SUCCESS** na HEAD da PR #191.
- F132: Node 22/24 e validação geral, ambos **SUCCESS** na HEAD da PR #192.
- F133: Node 22/24 e validação geral, ambos **SUCCESS** no commit `3d46f128ead41bd8499aaee117d1a24df3f79d95`, após corrigir a separação dos dados originais e do relatório sanitizado.
- Nesta RC49, todos os workflows serão reexecutados na **nova HEAD exata** e deverão ser revisados antes de qualquer liberação.

## Privacidade e origem da evidência

**NENHUM dump, URL real, termo de busca, ID de conta, conteúdo de leads nem credencial Google deve ser incluído neste repositório público.** Os arquivos de teste usam apenas `example.test` e conteúdo fictício.

O Google Search Console pode estar conectado separadamente ao OpenSEO, mas esse acesso **não significa** que o Portal tenha OAuth, grants por tenant, identidade de serviço, consentimento ou autorização técnica para ler a mesma propriedade. A F131–F133 é uma biblioteca sobre **insumos fornecidos pelo operador**, não integração Google online nem prova de indexação atual.

## Critérios para produção

1. Revisar todos os arquivos do diff paginado, migrations e workflows em branches paralelas; CI verde não substitui aprovação de segurança/SEO/LGPD.
2. Confirmar no domínio/controlador de produção o host canônico escolhido, redirecionamentos 301/308, sem hops/ciclos, URLs antigas correspondentes e conteúdo original.
3. Exigir rotas PT-BR/EN-US/ES-ES editorialmente úteis, canonical/hreflang recíprocos, sitemap atualizado e tráfego/lead/cliente separados conceitualmente.
4. Integrar OAuth GSC/GA4 do Portal apenas com grant real, escopo de leitura, identidade de serviço e retenção/consentimento adequados.
5. Homologar no staging Leaseweb com backups e ensaio de rollback, sem tocar CRM/Sites/outros serviços.
6. Obter aceite humano formal de publicação; manter `main`, VPS, DNS, cliente e cobranças intactos até então.

**ReleaseStatus: HOLD.** Esta RC apenas reúne provas de laboratório e verificadores privados; não cria rota HTTP de publicação nem aplica redirect real.
