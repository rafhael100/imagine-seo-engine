# SEO F153 — referência nacional da Malha IBGE 2025: Municípios x Unidades

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [RC57 #224](https://github.com/rafhael100/imagine-seo-engine/pull/224) e do controle de geocódigos F110/F111/F117.

## Correção conceitual essencial para o SEO nacional

A Malha Municipal Digital 2025 do IBGE declara **5.569 municípios juridicamente municipais**, mais **1 Distrito Federal (Brasília)** e **1 Distrito Estadual (Fernando de Noronha)**. Sua malha espacial também contém **2 áreas operacionais lacustres**, totalizando 5.573 geocódigos territoriais na *malha espacial*. Já as listagens estatísticas/localidades que contam Brasília e Fernando de Noronha têm **5.571 unidades**. **Não** se deve criar automaticamente uma página de *município* para qualquer um dos 5.571 códigos da base de localidades, nem confundir o total de malha espacial com o total de localidades.

Fontes:
- Malha Municipal Digital IBGE, edição 2025: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
- Quadro Geográfico de Referência IBGE 2024, com distinção entre 5.569 municípios e 5.571 unidades estatísticas: https://www.ibge.gov.br/apps/quadrogeografico/pdf/qg_2024_030_munic.pdf
- Estimativas de população IBGE, referência 01/07/2026: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html

## Implementação F153

O novo `reviewIbgeMmd2025NationalCoverage({reference,editionId:'IBGE_MMD_2025'})` examina **offline** a referência local normalizada F110/F111 e bloqueia se qualquer requisito estrutural da edição 2025 falhar:

- Exatamente 5.571 linhas de localidades, incluindo **exatamente duas exceções conhecidas** `5300108` (Brasília, DF) e `2605459` (Fernando de Noronha, PE).
- Exatamente 5.569 **candidatos a municípios** após separar essas duas exceções, sem contar áreas operacionais da malha como localidades.
- Registros de todas as 27 UFs, IDs IBGE de sete dígitos, prefixo de UF compatível, nomes sem caracteres perigosos, ordem e unicidade de códigos.
- Erro ou fonte incompleta = `blocked`; números coerentes = somente `human_edition_territorial_and_editorial_review_required`. Todos os campos de publicação, indexação, autenticidade da fonte e classificação jurídica independente permanecem **false**.

O classificador de dois códigos especiais já existia na F118/F110. A F153 **não repete a geração de páginas**; valida a cobertura estrutural nacional desse conjunto *antes* de qualquer lote editorial.

## Comando offline de revisão

```bash
node scripts/review-ibge-national-edition-offline.mjs \
  /AREA-PRIVADA/ibge-reference-f110.json
```

O arquivo deve ser um JSON regular sem symlink e de até 2 MiB; o comando não faz rede, não lê Google, não publica, não imprime nomes/códigos de cidades, nem arquivos brutos. Código 0 = revisão humana necessária; 2 = fonte estruturalmente incompleta/inconsistente; 1 = arquivo inválido.

## O que esta etapa não resolve

Uma lista **fictícia** com a contagem certa poderia passar em vários testes estruturais; assim, esta validação não autentica a origem IBGE, os nomes reais dos 5.569 municípios, a edição legal corrente, nem o direito de criar conteúdo SEO para cada cidade. Também não prova que a Imagine oferece serviços presenciais locais. Exigem-se recibo de fonte oficial F117/F120, edição vigente e evidência independente, conteúdo genuinamente útil, qualidade e localização, canonical/hreflang, revisão humana de cada campanha, segurança e homologação VPS.

A edição 2025 é **fixa por projeto**: quando o IBGE publicar uma malha posterior, a contagem e os códigos devem ser revistos antes de atualizar a política. Nunca inferir atualização somente por data ou por estimativa populacional.

**NO-GO para publicação, DNS, produção, merge e indexação automática.**
