# SEO-F105 — comparação offline de janelas OpenSEO/GSC

**Estado: DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** A F105
continua sobre a candidata RC40 (PR #150), não sobre main.

## Objetivo e limites

Comparar **duas séries diárias fornecidas manualmente** sem consultar Google
ou OpenSEO, sem transportar credenciais e sem atribuir autorização a tenant.
Os dois arquivos seguem o **mesmo esquema fechado de entrada F104**;
consulte [F104](SEO-F104-OPENSEO-DAILY-OFFLINE.md).

Cada arquivo local deve ser UTF-8, até 256 KiB, conter apenas
uma dimensão date e no máximo 92 linhas. Dados de testes são sintéticos.

## Execução no ambiente privado

    node scripts/compare-openseo-daily-offline.mjs previous.json current.json

Nenhum arquivo ou propriedade real deve ser commitado ao GitHub.
A ferramenta lê os arquivos locais e compara as datas apresentadas.
O comando rejeita arquivos com mesmo inode (incluindo hardlinks) e
não imprime paths, URLs de propriedade, entrada bruta ou exceções arbitrárias.

## Política de comparação

- Revalida **cada snapshot original** pelo mesmo adaptador F104. Um DTO
  previamente gerado não é prova de origem nem de autorização.
- Exige o **mesmo tenantRef** e a **mesma propriedade canônica/fingerprint**,
  sem mesclar propriedades URL-prefix e domain.
- As janelas devem ser **adjacentes, cronológicas e de igual duração**;
  não aceita períodos sobrepostos, invertidos ou com intervalos.
- Se faltou qualquer data fornecida em uma das janelas, devolve
  comparações numericamente **null**, não zeros ou alertas.
- Com todas as datas submetidas, calcula variação percentual de cliques
  e impressões, diferença de pontos percentuais de CTR e diferença
  de posição média ponderada observada.
- Se a linha de base for zero, a variação percentual é **null**.
  Ausência de posição média também produz diferença **null**.
- Nunca gera alertas automáticos de queda, causalidade ou ranking.
  A etiqueta ALL_DATES_SUBMITTED_ORIGIN_UNVERIFIED indica apenas
  cobertura das datas enviadas, **não** completude de origem Google.

## Restrições de segurança e homologação

O resultado informa explicitamente:
- sourceCompletenessNotProven = true
- oauthVerifiedForImagine = false
- portalTenantGrantVerified = false
- customerDisplayAuthorized = false
- productionReadAuthorized = false
- networkPerformed = false
- releaseStatus = HOLD_IMAGINE_BACKEND_AUTHORIZATION

Ainda pendem AppSec, LGPD, SEO editorial, autenticação/MFA/RBAC do
Portal, OAuth readonly consentido próprio do Imagine, vínculo e grants
por tenant/propriedade, isolamento PostgreSQL, staging/rollback/backups
e revisão independente. Conexão no OpenSEO **não** transfere permissões
para o SaaS Imagine. Este código não faz deploy nem publica dados.
