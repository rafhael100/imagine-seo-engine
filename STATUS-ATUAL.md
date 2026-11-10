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

## SEO-F20 — Diagnósticos seguros em todos os CLIs (10/11/2026)
- Erros de leitura/parse não imprimem trechos de JSON inválido, nomes de caminhos privados nem mensagens livres das fontes. Parser JSON e formato de diagnóstico comuns.
- Testes end-to-end com segredos fictícios comprovam sanitização; relatório offline segue sem autenticação ou rede.

## SEO-F21 — Ações imutáveis e permissões mínimas de CI (10/11/2026)
- Migração de checkout/setup-node tags para SHAs completos já verificados no pipeline Imagine Comercial, com `persist-credentials: false` e runner `ubuntu-24.04` fixado.
- Testes bloqueiam reintrodução de tags móveis, tokens de deploy e permissões adicionais; matriz Node 22/24 mantida.

## SEO-F22 — Controle de migrações com HOLD obrigatório (10/11/2026)
- Avaliador offline de candidatos a 301 verifica correspondência entre rotas removidas e destinos existentes, rejeita URLs externas/variantes perigosas e duplicatas; saída só agrega contagens.
- Mesmo mapeamentos estruturalmente completos são HOLD para revisão por URL; nenhum redirect ou deploy é gerado e CLI sai com código não-zero quando existe remoção de rota.

## SEO-F23 — Integridade de respostas GSC por página e métricas vazias (10/11/2026)
- Adaptador offline GSC rejeita consulta duplicada e ordem de cliques inconsistente em resposta de página única, além de campos de tenant/fingerprint/autorização adulterados.
- Analisador recusa CTR não zero em linha com zero impressões e exige limiar de impressões como inteiro seguro; testes estritamente sintéticos.
- Não há validação de identidade/propriedade OAuth, Google online, deploy ou manipulação de clientes reais.

## SEO-F24 — Envelope de revisão para futuro Portal (10/11/2026)
- Adiciona contrato offline `seo-portal-review-handoff-v1`: métricas agregadas, ações fechadas e escopo sintático do tenant/fingerprint, sem repassar consultas, páginas nem mensagens brutas.
- Negação explícita de autorização de exibição, propriedade e grant de tenant; exige verificação **independente** no backend Portal antes de tornar visível qualquer dado.
- CLI local e testes provam que flags de permissão injetadas pelo operador são ignoradas e que não se autentica ninguém.

## SEO-F25 — Auditor de cabeçalho público estrito (10/11/2026)
- Modo opt-in `--strict-public-head` verifica 1 meta robots publicável `index,follow` e 1 `og:url` idêntica à URL canônica em todas as rotas HTML públicas (exceto 404).
- Compatibilidade com builds anteriores mantida sem flag; novos testes sintéticos cobrem falta, duplicação e discrepância de metadados.
- A adoção no CI Comercial exige teste integrado e pin fixo; não há produção, Google, alteração de main ou deploy.

## SEO-F26 — Metadados somente do cabeçalho real (10/11/2026)
- O auditor agora considera `title`, `meta description`, `canonical`, `robots` e `og:url` somente em `<head>`, desconsiderando tags em comentários do cabeçalho e no corpo HTML.
- Testes com HTML propositalmente enganoso demonstram que metadados falsos não atendem ao gate técnico; o analisador permanece heurístico, não substitui um parser HTML de navegador.

## SEO-F27 — Limites de diretórios, entradas e profundidade (10/11/2026)
- Auditor agora enumera entradas de diretório em streaming e limita, por padrão, a 5.000 diretórios, 100.000 entradas totais e profundidade de 32, além de 20.000 HTML e teto de bytes pré-existentes.
- Limites podem ser reduzidos nos testes locais, mas nunca ampliados além do máximo permitido; falhas são explícitas, sem seguir symlinks e sem calls de rede.

## SEO-F28 — Leitura de grupos robots e sitemap (10/11/2026)
- Auditor distingue grupos `User-agent` para Googlebot e wildcard antes de classificar `Disallow: /`, evitando falsos positivos de regras exclusivas para outros robôs.
- Apenas diretiva real `Sitemap:` conta; comentários e menções em texto não são evidência de sitemap. Testes sintéticos de escopo, exceção e comentário.
- Heurística de raiz, não implementa todo o algoritmo de precedência de caminhos do RFC 9309; não substitui consulta real ao crawler Google.

## SEO-F29 — CLI de auditoria rejeita opções desconhecidas (10/11/2026)
- O `audit-dist.mjs` agora recusa flags com erros de digitação, duplicadas e argumentos posicionais excedentes; evita CI acidentalmente permissivo por `--fail-on-warning` em vez de `--fail-on-warnings`.
- Opções permanecem order-independent e não ativam integração externa; testes unitários e CLI end-to-end verificam falha fechada.

## SEO-F30 — Localização de páginas no sitemap sem comentários falsos (10/11/2026)
- Auditor ignora comentários XML ao coletar `<loc>`, exige `urlset` e entrada(s), rejeita DTD e URL com fragmento ou fora do canonical exato.
- Diagnósticos não reproduzem URLs dos arquivos de origem; testes sintéticos cobrem sitemap falso, XML incompleto e caminho válido.
- Verificador estático heurístico: não faz parsing XML geral nem acesso HTTP/Google.

## SEO-F31 — Bloqueios de indexação específicos do Googlebot (10/11/2026)
- Auditor reconhece `robots=none` e meta `googlebot` com `noindex`, `none` ou `nofollow` mesmo quando `robots=index,follow` geral está válido.
- O modo estrito também acusa `googlebot` meta duplicado; novos tipos são mapeados para revisão crítica no brief, sem alterar dados sensíveis.
- Não avalia cabeçalhos HTTP `X-Robots-Tag` nem comprova indexação real; requer staging HTTP/Google com autorização.

## SEO-F32 — Estrutura visível e navegação sem conteúdo comentado (10/11/2026)
- Auditor remove comentários HTML antes de localizar cabeçalho, JSON-LD, H1 e links, e considera apenas `<body>` para H1/navegação.
- Tags escondidas em literais de `<script>` e `<style>` não podem satisfazer H1 ou criar falsos links quebrados. Testes sintéticos com markup enganoso.
- Heurística estática, não valida CSS de visibilidade nem substitui QA em navegador; nenhuma mudança na web publicada.

## SEO-F33 — Orçamentos de relatórios, links, scripts e sitemap (10/11/2026)
- Auditor recusa builds que ultrapassem 50.000 apontamentos, 1.000 âncoras por página, 100.000 links locais, 128 scripts JSON-LD por página, 10.000 linhas de robots ou 20.000 URLs de sitemap.
- Os limites abortam a auditoria inteira (sem aprovar relatórios parciais), complementando os limites de diretórios e bytes já presentes.
- Testes adversariais sintéticos validam limites e compatibilidade de builds comuns; não há conectividade externa nem dados reais.

## SEO-F34 — Diretiva nofollow no robots geral (10/11/2026)
- O auditor agora sinaliza `meta name="robots" content="nofollow"` no cabeçalho público, mesmo sem modo estrito, além das restrições Googlebot já detectadas.
- O resumo executivo registra revisão de indexação/navegação sem refletir conteúdos privados; testes cobrem a regra, falso positivo em comentário e ausência de regressão em `index,follow`.

## SEO-F35 — Idioma do documento e canonical sem falsos positivos (10/11/2026)
- O auditor valida o idioma somente no `lang` da tag raiz `html`, exigindo uma única declaração `pt-BR` e não aceitando textos em comentários, scripts ou corpo.
- `rel=CANONICAL` passa a ser reconhecido conforme tokens de relação HTML case-insensitive, inclusive quando há múltiplos tokens.
- Cobertura com testes sintéticos e nenhuma mudança na integração GSC, produção ou main.

## SEO-F36 — Conteúdo de template inerte (10/11/2026)
- Tags de H1, navegação, metadados e JSON-LD que constem apenas de elementos HTML `<template>` não contam como evidência pública.
- O removedor cobre templates aninhados e ignora a sintaxe `<template>` contida em scripts/styles, reduzindo falsos positivos da análise do build estático.
- Testes sintéticos adversariais; não substitui DOM de navegador nem análise do JS após execução.

## SEO-F37 — Metadados de head imunes a texto bruto de scripts/estilos (10/11/2026)
- O auditor desconsidera scripts e estilos quando localiza title/meta/canonical/robots/og:url dentro de `<head>`; literais contendo markup HTML não podem satisfazer diretivas de indexação.
- A verificação JSON-LD continua independente sobre o HTML não comentado, sem alterar o comportamento de páginas legítimas.
- Testes adversariais sintéticos; nenhuma integração real, produção ou publicação alterada.

## SEO-F38 — Estrutura estrita de URL no sitemap (10/11/2026)
- O modo `strictPublicHead` agora exige uma `loc` por elemento `url`, impedindo entradas avulsas, elementos vazios ou duplicados na mesma entrada.
- Mantida compatibilidade do modo padrão e o limite de 20 mil URLs; a verificação permanece estática e não constitui parser XML normativo.
- Regressões sintéticas integradas ao CI; integração Comercial deve manter `--strict-public-head`.

## SEO-F39 — Pré-verificação segura de propriedade GSC (10/11/2026)
- Novo contrato offline verifica propriedade GSC exata e nível declarado de acesso de leitura, sem confundir domínio com URL-prefix ou propriedade de terceiros.
- Resposta só apresenta fingerprint e status de revisão, sem URLs de outras propriedades. OAuth, consentimento e grant do Portal permanecem `false` e a operação real fica sob `HOLD` mesmo quando a lista indica correspondência.
- Testes inteiramente sintéticos, sem consumir dados reais do Google ou credenciais.
