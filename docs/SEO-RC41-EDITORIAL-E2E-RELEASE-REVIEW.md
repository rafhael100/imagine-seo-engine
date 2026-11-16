# Imagine SEO Engine — RC41: pipeline municipal editorial integrada

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Integração documental
para revisão técnica, não uma liberação de produção.

## Escopo consolidado

Esta branch de release candidate parte da HEAD exata
F112 e inclui a sequência de desenvolvimento e testes:

- SEO-F107: qualidade por rascunho/lote, sem páginas doorway
- SEO-F108: inventário de até 50 mil registros, PT-BR/EN-US/ES-ES,
  colisões município+serviço+idioma, caminhos e hashes declarados
- SEO-F109: confronto entre novos rascunhos e inventário amplo
- SEO-F110: conferência local de código municipal, prefixo UF
  e nome em referência fornecida pelo operador
- SEO-F111: importação local de JSON no formato IBGE Localidades v1,
  para alimentar F110 **sem autenticar origem por conta própria**
- SEO-F112: arquivos HTML de **prévia privada**, com identidade Imagine,
  noindex/nofollow, CSP e texto editorial escapado
- Teste **ponta a ponta**: export IBGE-style → referência F110
  → F107/F108/F109 → F112 HTML offline

O histórico herdado inclui também outras etapas previamente
desenvolvidas de auditoria e GSC offline; portanto, o diff desta
RC contra main precisa de revisão integral, não apenas destes
últimos seis recortes. PRs anteriores continuam abertas, sem
merge automático ou substituição de suas revisões.

## Reprodução, exclusivamente no ambiente de desenvolvimento

    npm test
    node scripts/import-ibge-localities-offline.mjs source.json reference.json
    node scripts/reconcile-geo-reference-offline.mjs drafts.json inventory.json reference.json
    node scripts/render-geo-editorial-previews-offline.mjs drafts.json inventory.json reference.json ./preview-private-new

Regras da demonstração:
- Os três primeiros arquivos são **privados** e não devem ser
  incluídos em commits, CDN ou uploads públicos.
- A pasta de prévias deve ser **nova e local**. Nunca usar dist/,
  public/, artifacts de deploy, rotas servidas nem GitHub Pages.
- O HTML local permite visualização editorial, não pode ser
  divulgado a clientes ou indexadores.
- Duplicação, UF divergente ou conteúdo sem qualidade não deve
  produzir qualquer HTML de prévia.

## Gates de liberação não negociáveis

1. Revisão independente de SEO editorial: comprovar conteúdo único,
   útil, atendimento local verdadeiro e evitar páginas doorway
2. Referência municipal oficial: registrar origem IBGE, edição,
   integridade, data de obtenção e cobertura relevante
3. Segurança e LGPD: retenção, acesso privado aos drafts, contenção
   de dados pessoais e trilhas de revisão sem exposição
4. Integração Imagine Sites/Portal: identidade autenticada, tenant,
   autorização de conteúdo, fluxo editorial e CMS/publicação
5. Operação Google GSC: OAuth real readonly, propriedade por tenant,
   grants vivos, revogação, auditoria, segregação de tokens
6. Homologação VPS/staging: backups/restauração, HTTPS, logs,
   rollback e testes de concorrência, com equipe responsável
7. Testes de produção separados: auditoria técnica das páginas
   efetivamente construídas, robots, canonical, hreflang, sitemap,
   redirecionamentos e indexação deliberada
8. Aceite formal e explícito da publicação. Nenhum CI offline,
   prévia, registro sintético ou PR Draft serve como aceite

## Riscos conhecidos

- A validação sintática de JSON IBGE não comprova procedência.
- Um inventário de 50 mil **linhas** não comprova completude nacional.
- Igualdade de hash não substitui análise semântica de textos.
- Os modelos Visitas → Leads → Clientes dependem de fontes
  Analytics e CRM autenticadas; cliques GSC não são visitas.
- Não há login, OAuth Google produtivo, acesso às contas de
  clientes, merge ou deploy nesta RC.

**Alterações em main, VPS, DNS, cobrança e produção: nenhuma
autorizada por este documento.**
