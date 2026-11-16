# SEO F157 — gate triplo de procedência IBGE, cobertura nacional e DTB

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [F156 #231](https://github.com/rafhael100/imagine-seo-engine/pull/231) e do [bloqueio F117/IBGE #230](https://github.com/rafhael100/imagine-seo-engine/issues/230).

## Objetivo

O Imagine SEO precisa trabalhar com os mesmos dados municipais em três revisões diferentes, sem permitir que cada operador indique uma lista diferente em cada etapa:

1. **F117/F154:** conferir que o JSON F110/F111 fornecido corresponde exatamente, byte a byte, ao digest SHA-256 do recibo HTTPS da API IBGE. O recibo é fornecido pelo operador e não equivale a assinatura oficial.
2. **F153:** verificar a referência municipal nacional de 2025 (5.569 candidatos municipais, Brasília e Fernando de Noronha, totalizando 5.571 localidades, 27 UFs).
3. **F156:** conferir códigos, UF e nomes **dos mesmos registros F110 já verificados pelo recibo** contra um CSV independente normalizado do relatório DTB 2025, obtido e convertido do workbook oficial pelo operador.

Qualquer divergência entre os três conjuntos fica bloqueada. Mesmo quando as três estruturas coincidirem, somente `human_official_ibge_provenance_edition_and_editorial_review_required`: nunca `GO`, `PUBLISHED`, indexação ou geração de redirecionamento.

## Comando privado

```bash
node scripts/review-ibge-three-source-offline.mjs \
 /AREA-PRIVADA/ibge-localidades-f110.json \
 /AREA-PRIVADA/ibge-https-capture-f117-receipt.json \
 /AREA-PRIVADA/dtb-2025-municipios-normalizado.csv
```

Os três arquivos ficam fora do Git. O relatório exibe somente contagens, regras e flags, sem nomes/geocódigos reais, URLs, IDs de empresa ou caminhos. Saídas: `0` = candidato a revisão humana; `2` = divergência bloqueada; `1` = entrada ou comprovante inválido.

## Melhoria concreta do workflow online F120

O workflow `.github/workflows/seo-f117-official-ibge-source-ci.yml` agora executa **F154/F153 após o download oficial F117 e a confirmação SHA do recibo**. Isso corrige uma lacuna anterior: uma API poderia retornar, por exemplo, 5.570 entradas com SHA válido e mesmo assim a captura antiga produzir recibo de sucesso. Agora o job real bloqueia a cobertura inválida antes de considerar a prova pronta.

O job online **continua opt-in** (etiqueta `verify-official-ibge` ou dispatch), porque o endpoint oficial falhou na execução de 16/11/2026; testes determinísticos permanecem separados. O F120 não exige o CSV DTB durante a chamada de API: esse segundo documento oficial é uma entrada privada operacional e não pode ser inventado pela CI.

## Limites e riscos

- Não há parser automático de workbook XLS/ODS, captura DTB ou autenticação criptográfica independente do material no Engine; seguem sob responsabilidade de operador autorizado, com recibos, URL, data e cadeia de custódia.
- Um atacante pode forjar tanto o arquivo JSON quanto o recibo e o CSV normalizado. Por isso todos os campos de proveniência independente e publicação são `false`.
- A edição territorial pode mudar; o gate de 2025 deve ser atualizado somente após confirmação da nova edição oficial.
- Uma referência correta não garante serviço efetivo da Imagine na cidade nem a qualidade editorial necessária para páginas geográficas.
- Continuam pendentes GSC por tenant, LGPD, integração Portal/Sites, segurança independente, homologação Leaseweb isolada, backup/restore/rollback e aceite humano.

**Nada nesta etapa altera main, VPS, Google, DNS, páginas indexadas, CRM ou clientes.**
