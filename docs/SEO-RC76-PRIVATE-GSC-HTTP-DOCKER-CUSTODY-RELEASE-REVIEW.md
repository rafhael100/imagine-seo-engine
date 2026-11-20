# Imagine SEO RC76 — cadeia privada GSC/HTTP e inventário Docker, mantendo F348 real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base cumulativa validada

A [RC75 #298](https://github.com/rafhael100/imagine-seo-engine/pull/298) concluiu **67/67 workflows SUCCESS** na revisão `8432661c68fd6982f0a6135016c00aa06472a031`. Preserva o histórico de desenvolvimento do Engine até RC74, IBGE DTB/Áreas 2025, filtros territoriais e editoriais, GSC PAGE com dados sintéticos seguros, as versões imutáveis Comercial F336/F344/F346/F348, Chromium PT/EN/ES e os testes de candidatas 301.

Os dois modos de Nginx Docker real continuam disponíveis e distintos: F197 com **uma única porta publicada no loopback host** para HEAD 301 e GET HTML byte idêntico, e F198 com bridge **`internal: true`, zero portas publicadas**, para leitura HTML somente dentro do container. Nenhum modo é homologação Leaseweb.

## Novas entregas integradas

1. [F199 #299](https://github.com/rafhael100/imagine-seo-engine/pull/299), SHA `95b6c753108995663b0cd47196d00f63a0822850`: reforça a CLI de preflight F143 para exigir fontes GSC e manifestos 301 **0600** sob diretórios **0700**, fora de qualquer árvore Git/worktree/submódulo. Os comprovantes HTTP privados usam a mesma restrição e são criados sem sobrescrever. Verifica inode/dispositivo do arquivo aberto, não imprime URLs ou caminhos e **não faz HEAD/GET se a custódia for insegura**. CI própria **3/3 workflows SUCCESS**, inclusive F150 Nginx Docker real.
2. [F200 #300](https://github.com/rafhael100/imagine-seo-engine/pull/300), SHA `14ed502f74e845cf8639b3a31c0f84e9681ba8b7`: aplica o mesmo contrato à saída do coletor local F148 de topologia Docker. O local de custódia é verificado **antes de `docker context inspect`**, garantindo que nenhuma consulta de serviços, portas, containers ou redes ocorra caso a saída seja pública ou esteja sob Git. Testes instrumentam `docker` e `ss` de laboratório e provam ausência da chamada; CI **2/2 workflows SUCCESS** em Node 22/24.

A função comum `reviewPrivateOperatorFilePath` preserva contratos de caminho/posse/permissão, sem conceder poderes a qualquer operador ou aplicação. A cadeia técnica F143/F148/F149/F150/F151/F197/F198 continua sem alterações de produção.

## Validação obrigatória na HEAD da RC76

Obter todos os workflows do próprio commit final da RC76, com **SUCCESS** e nenhum pendente/falho, incluindo F143/F199 e F148/F200, CI da versão Comercial F348, F197/F198 Nginx Docker, F149/F150/F151/F152, GSC F183–F187, IBGE 2025 e revisão do diff acumulado F188. Os testes de uma PR de origem não autorizam marcar a candidata como validada.

## Bloqueadores reais que permanecem

- Google OAuth `webmasters.readonly` e `sites.list` **autenticados pelo Portal/SEO Engine** por empresa/propriedade, com sessão MFA, consentimento, cofre de tokens, revogação, expiração e auditoria. OpenSEO tem uma conexão separada; laboratórios Portal F418/F117 não são tokens reais.
- Revisão independente AppSec/DBA/LGPD, validação de conteúdo original e oferta comprovada de serviços locais (o IBGE sozinho não demonstra cobertura comercial).
- Homologação autorizada na **VPS Leaseweb** com identidade TLS, firewall/portas, serviços independentes, backups, restauração, rollback, 301/canonical/hreflang observados e inventário autenticado por operador.
- GO humano específico para merge, deploy, DNS, publicação/indexação e qualquer despesa.

**Não houve merge, deploy, mudança de DNS, autorização Google real, leitura de cliente ou gasto. `main` e VPS permanecem intocados.**
