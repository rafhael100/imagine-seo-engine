# SEO F154 — conciliar a integridade da fonte IBGE com a cobertura nacional

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Evolui [F153 #225](https://github.com/rafhael100/imagine-seo-engine/pull/225) e os controles de procedência F117/F120.

## Falha que evita

Uma lista com **5.571 unidades estatísticas** pode ter a estrutura correta, mas ter sido modificada depois da captura. Inversamente, um recibo SHA-256 pode corresponder a um arquivo **incompleto** (por exemplo, 5.570 unidades), sem qualquer garantia de cobertura. A F154 exige **as duas verificações** sobre os mesmos bytes do arquivo privado:

1. **F117**: compara o SHA-256 do JSON normalizado com o recibo de captura HTTPS do endpoint oficial IBGE e recusa campos de falsa autorização, origem divergente ou total alterado.
2. **F153**: após verificar o recibo, classifica a estrutura segundo a **Malha Municipal 2025**: 5.569 candidatos municipais mais Brasília (DF) e Fernando de Noronha (PE), 5.571 localidades totais, 27 UFs, códigos únicos, prefixos válidos, sem duplicatas ou unidade especial omitida.
3. Responde somente **contagens e flags**; nunca divulga nomes, geocódigos, caminhos ou conteúdo. Arquivo incompleto = `blocked`; estruturalmente coerente = `human_provenance_territorial_edition_review_required`. Ambos mantêm a autoridade de publicação **false**.

## Comando único (sem internet)

```bash
node scripts/review-ibge-receipt-national-offline.mjs \
 /AREA-PRIVADA/ibge-reference-f110.json \
 /AREA-PRIVADA/ibge-capture-receipt.json
```

Esses arquivos devem ser obtidos previamente e preservados com cadeia de custódia: idealmente usando a captura HTTPS oficial F117 quando o endpoint estiver disponível. A captura histórica tentou usar a API oficial, mas houve indisponibilidade no runner GitHub Actions em 15/11/2026; CI offline verde **não comprova uma nova captura real**. O comando recusa arquivos malformados, symlinks, recibo inconsistente e entrada excessiva. Exit 0 = somente revisão humana; 2 = cobertura territorial bloqueada; 1 = erro/recibo inválido.

## Fonte oficial e limites de autenticidade

O IBGE informa na Malha Municipal 2025 **5.569 municípios**, um Distrito Federal, um Distrito Estadual e duas áreas operacionais, totalizando 5.573 unidades na malha espacial, que **não deve** ser confundida com o diretório estatístico de 5.571 unidades.

- Malha 2025: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
- Registro de Referência de Municípios (API): https://www.gov.br/conecta/catalogo/apis/registro-referencia-municipios
- Estimativas de população 2026: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html

**Um recibo F117 é uma evidência de transporte e integridade fornecida pelo operador, não assinatura digital do IBGE.** Mesmo que o SHA corresponda e os 5.571 registros tenham a estrutura esperada, um operador poderia forjar os dois arquivos. A F154 mantém explicitamente `sourceAuthenticatedByIndependentChannel=false`, `edition2025LegallyConfirmed=false`, `publicationAuthorized=false` e `indexingAuthorized=false`. A edição vigente e a classificação real exigem conferência de fonte independente antes de publicação.

Continuam pendentes editorial local original com serviços realmente prestados, canonical/hreflang, revisão LGPD/SEO/AppSec, propriedade GSC por tenant, IA/crédito sob controle, homologação e rollback na VPS, autorização de merge e de publicação.

**Sem alteração de DNS, VPS, `main`, serviços externos, leads ou cobranças.**
