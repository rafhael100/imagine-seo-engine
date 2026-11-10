# STATUS-ATUAL — Imagine SEO Engine
Referência: 09/11/2026.

## Marcos
- PR #2: auditoria técnica offline — https://github.com/rafhael100/imagine-seo-engine/pull/2
- PR #3: oportunidades por exportação Search Console já fornecida, sem OAuth — https://github.com/rafhael100/imagine-seo-engine/pull/3
- Execução validada: https://github.com/rafhael100/imagine-seo-engine/actions/runs/42558817682

## Resultado verificado
- 11/11 testes sintéticos Node aprovados.
- Auditor pinado no Imagine Comercial: execução CI https://github.com/rafhael100/imagine-comercial/actions/runs/42559456590 com 15 URLs estáticas, zero erros e zero avisos de auditoria.
- NÃO há Google Search Console, Google Analytics, CrUX, rankings ou dados de clientes conectados, OAuth configurado, produção, SaaS multiempresa, cobrança ou deploy.

## Próximas ações P1
- Melhorar auditor com parser HTML especializado se necessário.
- Planejar OAuth GSC seguro e importação autorizada, sem inventar métricas.
- Definir isolamento multiempresa e análise de qualidade de páginas territoriais.
- Manter foco principal no site comercial Imagine.

## F2 — 09/11/2026
- PR #4: https://github.com/rafhael100/imagine-seo-engine/pull/4 — avaliação de relevância para páginas geográficas por município, risco de duplicação e bloqueio de publicação automática; sem geração de páginas ou dados IBGE reais.
- CI validado: https://github.com/rafhael100/imagine-seo-engine/actions/runs/42575468770 — **19/19 testes Node aprovados**.
- Matriz de similaridade usa trigramas de palavras e normaliza cidades/UF como tokens; é sinal de revisão, não prova de originalidade ou existência de cidade na base oficial.
- Prioridade P1 mantida; primeiro cliente técnico segue Imagine Comercial, mas nenhuma propriedade GSC/GA4 está conectada e o motor não tem dados reais ou infraestrutura SaaS multiempresa em execução.
- Próximos gates: pesquisa com fontes verificadas, conexão OAuth consentida, governança multiempresa, autorizações por cliente, integração ao Portal, publicação editorial supervisionada e homologação de produção.


## Consolidação P1 — SEO-F5 e consumo pelo Comercial (09/11/2026)
Esta seção é o **estado atualizado**; indicadores de testes acima são registros históricos.

- PRs #2–#7 permanecem em draft empilhados, sem merge na `main`; [ponta SEO-F5](https://github.com/rafhael100/imagine-seo-engine/pull/7) SHA `238acb0772dc7597f23ce3fd1761d68be1d35179`.
- **35/35 testes Node** da biblioteca SEO aprovados no [CI do motor](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42610898272).
- Auditor offline: canonicals, indexação, schema, sitemap, robots, links internos, páginas órfãs e profundidade; política de bloqueio de erros/avisos utilizada pelo site comercial.
- O importador de CSV Search Console da dimensão Consultas aceita cabeçalhos PT-BR/EN, janelas explícitas, comparação de períodos e filtragem inicial de dados identificáveis; não conecta OAuth nem comprova propriedade/total de acessos.
- Integrado ao **Imagine Comercial P0** pelo checkout de SHA fixo, com os **35 testes próprios do SEO Engine executados dentro do [CI do Comercial](https://github.com/rafhael100/imagine-comercial/actions/runs/42620760030)**; 78 testes do site e auditoria de 15 páginas passaram.
- Sem conexão real GSC/GA4, tráfego, métricas orgânicas verdadeiras, credenciais ou autorização de clientes. Não há geração/publicação de páginas territoriais em massa.
- Próxima prioridade: autorização da propriedade, OAuth e LGPD/retention depois de aprovação explícita; manter auditoria técnica e proteção de migração do Imagine Comercial como consumidor inicial. Nenhum merge, deploy ou compra automática.

## SEO-F6 — Integridade de datas e contadores (09/11/2026)
- Nova validação comum de datas civis UTC: rejeita datas impossíveis (ex.: 29/02 em ano não bissexto), intervalos invertidos e períodos superiores a 92 dias.
- Importação CSV e análises de consultas usam o mesmo contrato; acumuladores rejeitam overflow de inteiros seguros e de posição ponderada.
- Cobertura sintética de calendário, intervalo e overflow; sem credenciais, gastos, dados de clientes, publicação ou merge na `main`.

## SEO-F7 — Contrato para consumo read-only multiempresa (09/11/2026)
- Adaptador local de relatórios GSC com identificadores de empresa, fingerprint de propriedade e origem, dados agregados e filtro de consultas pessoais.
- Comparações offline bloqueadas quando empresa/propriedade declarada divergem, com testes sintéticos.
- NÃO há autenticação, conexão OAuth, verificação real de propriedade, banco de dados, consentimento persistido ou isolamento de produção.

## SEO-F8 — Segurança do auditor estático (09/11/2026)
- Leitura local de robots.txt/sitemap.xml limitada a 5 MiB e protegida contra links simbólicos; URL de origem rejeita credenciais/porta customizada.
- Casos de regressão sintéticos para path symlink, recurso gigante e URL de origem insegura.
- Sem rede, deploy, OAuth, publicação, gasto ou merge na `main`.

## SEO-F9 — Comparação offline entre builds (09/11/2026)
- Gate que compara relatórios de auditoria, bloqueando novos erros, avisos e quedas de número de páginas por padrão; CLI offline retorna status de falha.
- Relatório emitido é sanitizado, sem mensagens livres de URLs; testes sintéticos garantem comportamento de política.
- Sem integração automática no site comercial nem alteração em `main`; futura adoção exige CI validado e atualização controlada da referência pinada.

## SEO-F10 — Contrato futuro de consulta read-only GSC (09/11/2026)
- Planejador sem rede para método Search Analytics POST, escopo OAuth mínimo, período validado, limites de linhas e normalização agregada de resposta sintética.
- Não acessa contas, não guarda tokens, não configura OAuth, não comprova propriedade nem representa tráfego real.
- Ativação depende de autorização da propriedade/Portal autenticado, políticas LGPD e homologação protegida. Sem merge `main`/deploy.

## SEO-F11 — Paginação de consultas GSC offline (09/11/2026)
- Agrega páginas sintéticas ordenadas, bloqueia duplicatas, lacunas de offset e excedentes; saída com métricas agregadas e sinais de possível truncamento.
- Não executa API, OAuth, consulta de contas, credenciais ou armazenamento; apenas preparação técnica de integração.

## SEO-F12 — Segurança de leitura HTML e esquemas de links (09/11/2026)
- Reabertura de arquivo HTML com O_NOFOLLOW (quando disponível) e revisão de tipo/tamanho, evitando leitura de symlink no último componente após o inventário inicial.
- Auditor rejeita URLs de hyperlinks com protocolos data, file e vbscript e URLs com credenciais.
- Testes sintéticos de symlink, HTML excessivo e protocolos inseguros. Ainda exige workspace de build confiável contra troca de diretórios pais.

## SEO-F13 — Inventário de rotas e detecção de migração acidental (09/11/2026)
- O auditor fornece inventário ordenado das rotas HTML públicas para distinguir páginas apenas substituídas de perdas reais.
- Comparador de build bloqueia remoção de rota com mesmo número total de páginas, rejeita inventário malformado e perda de inventário previamente presente.
- Comparações antigas sem inventário continuam usando regra conservadora por contagem, sem fingir avaliação de URL.

## SEO-F14 — Conformidade de respostas simuladas GSC (09/11/2026)
- Adaptadores de consultas e paginação rejeitam tipo de agregação incompatível, datas parciais em respostas que deveriam ser finais, planos adulterados e ordem de cliques inconsistente.
- Verificação dos parâmetros conforme documentação oficial, mas **sem execução OAuth, chamadas reais ou comprovação de dados do Search Console**.

## SEO-F15 — Testes E2E offline de CLIs e manual de operação (09/11/2026)
- Testes sintéticos invocam comandos de auditoria, importação/comparação CSV e gate de URLs em processos separados e temporários.
- README atualizado para estado real de implementação; checklist de bloqueios externos mantido.
- PR draft sem merge/deploy; não significa SaaS ou Search Console operacional.

## SEO-F16 — Leitura segura de arquivos e diagnóstico sem vazamento (09/11/2026)
- CLIs locais agora compartilham leitor limitado em bytes com abertura segura e rejeição de links simbólicos finais; mensagens de URL inválida no sitemap não reproduzem a URL bruta.
- Testes sintéticos de inputs symlink e segredos em sitemap; processos permanecem offline, sem credenciais, rede ou armazenamento adicional.

## SEO-F17 — Resumo executivo offline sem dados brutos (09/11/2026)
- Contrato `seo-brief-offline-v1` agrupa problemas técnicos e sinais de variação GSC em ações fixas e métricas sintéticas para consumo futuro pelo Portal.
- CLI limitada a relatórios locais, mensagens livres e caminhos originais descartados; não conecta Google nem garante causalidade, ranking ou conversão.

## SEO-F18 — Compatibilidade Node 22/24 e bloqueio de CI (09/11/2026)
- Workflow somente leitura passa a executar a suíte offline em Node 22 e Node 24, com timeouts e sem segredos, deploy nem dependências externas de código.
- Não habilita publicação ou integração GSC real; confirma apenas os comportamentos cobertos pelos testes sintéticos.

## SEO-F19 — Leitura limitada de HTML e arquivos auxiliares (10/11/2026)
- Auditor agora usa o mesmo leitor seguro limitado em bytes da F16 para HTML, robots e sitemap; evita crescimento não limitado após stat.
- Contratos anteriores de erros seguros são preservados e novos testes cobrem HTML próximo do teto e sitemap via symlink.
- Sem chamadas externas ou dados reais; workspace de build precisa permanecer isolado contra trocas de diretórios ancestrais.
