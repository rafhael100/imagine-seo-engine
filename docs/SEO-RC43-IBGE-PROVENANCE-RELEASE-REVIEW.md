# Imagine SEO Engine RC43 — dados territoriais, integridade e gate IBGE

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Consolidação para revisão independente contra `main`, não autorização de produção.

## Evolução em relação à RC42

A [RC42 #165](https://github.com/rafhael100/imagine-seo-engine/pull/165) incluiu o pipeline editorial municipal, previews privados, inventário amplo, auditoria do HTML público, prova de bloqueio no Astro compilado e proteção de diretórios.

A RC43 adiciona os módulos:
- [F117 #166](https://github.com/rafhael100/imagine-seo-engine/pull/166): tentativa de obter JSON do endpoint HTTPS oficial IBGE, autenticação do destino de rede, validação do payload, hashes SHA-256 e recibo de integridade. **Endpoint inacessível ao runner no teste de 15/11/2026; não houve captura oficial aprovada**.
- [F118 #169](https://github.com/rafhael100/imagine-seo-engine/pull/169): revisão separada dos geocódigos conhecidos de Brasília/DF e Distrito Estadual de Fernando de Noronha. Não equiparar todos os registros do produto Localidades a municípios juridicamente autônomos.
- [F119 #172](https://github.com/rafhael100/imagine-seo-engine/pull/172): modo alternativo offline que confere arquivo IBGE-style contra SHA-256 **esperado e fornecido por canal independente**; revalida conteúdo e recibo. Não inventa uma comprovação de origem sem evidência externa.
- [F120 #174](https://github.com/rafhael100/imagine-seo-engine/pull/174): divide CI determinístico dos testes de disponibilidade real do IBGE. O segundo só roda por etiqueta `verify-official-ibge` ou disparo manual apropriado, permanecendo requisito explícito de homologação.

## Evidências verificáveis

- `npm test` Node 22/24 com casos de negativa: origem falsa, HTTP, redirect, corrupção, fontes incompletas, sinalizações de autorização fraudulentas, privacidade e classificação territorial.
- Compilação Astro do Comercial multilíngue em commit fixado, auditoria de 45 páginas, regressões de canonical/hreflang e teste de vazamento privado, sem tocar na VPS.
- Verificação real IBGE F117 em 15/11/2026 **NÃO PASSOU**: GitHub Actions `curl` código 28, HTTP 000; Node não conseguiu estabelecer conexão. Essa falha continua impedindo chamar a referência de 'oficialmente obtida' pelo pipeline.

## Como retomar a verificação do endpoint

Na PR da RC43, o mantenedor pode aplicar a etiqueta `verify-official-ibge` para executar a verificação HTTPS real, preservando evidência do commit exato. A etiqueta não publica URLs, não faz merge e não aprova o dataset automaticamente. Uma execução externa bem-sucedida ainda precisa de validação da edição territorial, fonte, classificação e revisão editorial.

Se o servidor continuar indisponível, o operador pode fornecer um JSON obtido pelo IBGE por outro canal e um hash independente verificado. O procedimento F119 confere integridade, mas **mantém oficialOriginAuthenticated=false e o release em HOLD** até análise independente da origem.

## Checklist operacional ainda pendente

1. Verificar a edição oficial vigente, a integridade e origem do arquivo da referência municipal; distinguir municípios, Distrito Federal, distrito estadual e áreas operacionais. Não confundir número de entradas da API com municípios atendidos.
2. Usar somente conteúdo original e de valor local, com comprovação de atendimento pela Imagine e revisão editorial formal.
3. Garantir autenticação real, MFA e autorização por empresa no Portal/Sites; Google OAuth somente leitura com validação e revogação efetiva da propriedade.
4. Testar Analytics e CRM com atribuição real da metodologia Visitas → Leads → Clientes; cliques GSC não são sessões, leads ou vendas.
5. Revisão AppSec/DBA/LGPD, infraestrutura de homologação, HTTPS, backups e restauração, release reversível e testes de publicação/robots/sitemap/canonical/hreflang na VPS.
6. Aprovação formal da transição de PRs Draft para release após revisão integral do diff desta RC contra `main`.

**Status:** desenvolvimento e testes offline avançados. Fonte IBGE real, autenticação/produto e implantação continuam NO-GO.

Nenhum merge, deploy, segredo, cobrança, DNS ou dado de cliente alterado por esta RC.
