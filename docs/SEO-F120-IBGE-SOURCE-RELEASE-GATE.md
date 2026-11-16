# SEO F120 — separar testes offline do gate de consulta real ao IBGE

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continua [F119 #172](https://github.com/rafhael100/imagine-seo-engine/pull/172).

## Por que foi necessário

Na F117, o código de captura HTTPS passou em testes unitários, mas o endpoint `servicodados.ibge.gov.br` não respondeu no GitHub Actions em 15/11/2026. O CI em execução automática falhou com `curl` exit 28 (HTTP 000) e cliente Node com timeout. O mesmo problema pode voltar sem que o código tenha mudado.

Misturar testes **determinísticos de software** e disponibilidade de **fonte externa** em um único job deixa pouco clara a causa e causa novas consultas a cada pequena alteração de código.

## Workflow novo

O arquivo `.github/workflows/seo-f117-official-ibge-source-ci.yml` separa duas evidências:

**1. offline-contract (obrigatório por PR):** executa `npm test` em Node 22 e Node 24, inclusive todos os testes de resposta, estrutura, hash, origem forjada e privacidade. Aprovar esse job comprova somente o contrato implementado, **não** o download do IBGE.

**2. live-official-source (ativação explícita):** é executado quando um mantenedor aplica a etiqueta `verify-official-ibge` à PR, causando evento `pull_request.labeled`, ou por execução manual quando o workflow estiver disponível no ramo padrão. O job exige sucesso do contrato offline, consulta o endpoint oficial exato, verifica o recibo SHA-256 e apaga os arquivos de origem. Se o IBGE estiver inacessível, ele **falha** e a liberação permanece bloqueada.

Executar o contrato automático sem o job de rede **NÃO** remove o gate real. A revisão de release deve exigir evidência verde e recente da consulta oficial, além de conferência independente de edição, tipologia territorial e conteúdo editorial.

## Procedimento de homologação

1. Revisar a PR e a documentação dos contratos.
2. Aplicar etiqueta `verify-official-ibge` na PR quando desejar repetir a verificação externa sem criar outro commit. Se já estiver aplicada, remover e reaplicar para gerar novo evento.
3. Conferir na SHA exata o resultado do job `live-official-source`, inclusive o recibo e a data do teste, que são registrados no log sem publicar os dados municipais brutos.
4. Confirmar edição territorial, municípios versus DF/distrito estadual, autorização editorial, Portal/Sites, AppSec/LGPD, backups, homologação VPS e rollback antes de qualquer publicação.

**Importante:** a estrutura do endpoint oficial pode mudar, e a origem HTTPS não equivale a assinatura digital da versão da Malha Municipal. Uma lista com ~5,5 mil registros não comprova a quantidade de municípios juridicamente existentes.

Nenhuma alteração em `main`, DNS, VPS, indexação ou dados de clientes.
