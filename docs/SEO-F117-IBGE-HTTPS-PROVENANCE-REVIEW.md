# SEO F117 — captura HTTPS oficial IBGE e prova de integridade local

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continua a [RC42 #165](https://github.com/rafhael100/imagine-seo-engine/pull/165).

## Entrega operacional nova

As etapas F110/F111 anteriormente exigiam um export da API IBGE
preparado manualmente. Agora existe um comando de captura do endpoint
público oficial, com transporte Node.js HTTPS e destino local privado:

    node scripts/capture-official-ibge-reference.mjs reference-new.json receipt-new.json
    node scripts/verify-ibge-official-receipt.mjs reference-new.json receipt-new.json

URL HTTPS **fixa** (não aceita URL de operador):
https://servicodados.ibge.gov.br/api/v1/localidades/municipios

A API de localidades consta no catálogo oficial de APIs
governamentais https://www.gov.br/conecta/catalogo/apis/registro-referencia-municipios .

## Segurança e integridade

- Requisição somente GET para endereço oficial fixo; sem cookies, token,
  chave, query dinâmica, HTTP, redirecionamentos ou URLs de terceiros
- Exige status 200, URL final idêntica, tipo application/json e limita
  a resposta a 8 MiB (cabeçalho e bytes efetivamente consumidos)
- Usa UTF-8 estrito e a validação F111 de código/UF/hierarquia municipal
- Permite ausência de microrregião antiga somente quando existe uma
  hierarquia geográfica válida para identificar a UF
- Registra SHA-256 dos bytes recebidos e do arquivo normalizado F110
- Registra data UTC, origem declarada, tamanhos e flags de liberação
  **false**. Arquivos locais 0600, criação exclusiva, sem sobrescrita
- O verificador offline confere novamente o digest e rejeita
  afirmações de autenticidade de edição, cobertura nacional ou
  autorização de publicação criadas por alguém
- CI GitHub Actions obtém a referência diretamente do IBGE no runner
  descartável e apaga os arquivos temporários ao final; não anexa
  artefatos ou registra listagens municipais nos logs

## Distinções territoriais obrigatórias

Uma referência com milhares de códigos não comprova que cada unidade
seja um Município. O IBGE diferencia municípios de Distrito Federal,
Distrito Estadual de Fernando de Noronha e áreas operacionais
em sua Malha Municipal Digital 2025 (5.569 municípios; outras
categorias territoriais têm registros próprios).

Referência oficial:
https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html

O endpoint de Localidades e a malha territorial são **produtos
distintos**. Esta etapa NÃO estabelece equivalência exata entre
todas as entradas, nem certifica número oficial de municípios,
cobertura de serviços, base cadastral imutável, edição territorial,
assinatura criptográfica IBGE ou comportamento do site ao vivo.

A confirmação operacional de cobertura por município e da categoria
territorial deve ser feita separadamente antes de gerar páginas.

## Limites de publicação

Os arquivos de referência e recibo não são publicadores. A origem
HTTPS fixa fornece evidência de transporte àquele host no momento da
captura, mas não substitui auditoria independente do conteúdo e edição.
O resultado permanece explicitamente NO-GO para indexação/produção.

Ainda pendem:
- Conferência da edição e da semântica das unidades territoriais
- Revisão editorial e comprovação do atendimento local
- Portal/Sites autenticados com aprovação de publicação
- Google OAuth readonly com propriedade efetivamente verificada
- AppSec/LGPD, backups, rollback, homologação VPS e aceite explícito

**Sem merge, deploy, alteração de main, DNS, VPS, cobrança ou dados privados.**
