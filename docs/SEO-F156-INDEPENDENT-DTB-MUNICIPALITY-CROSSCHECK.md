# SEO F156 — segundo caminho oficial IBGE: tabela DTB 2025 (sem depender da API)

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [RC59 #229](https://github.com/rafhael100/imagine-seo-engine/pull/229) e do [bloqueio IBGE #230](https://github.com/rafhael100/imagine-seo-engine/issues/230).

## Por que esta entrega ajuda a implantação

A captura HTTPS da API oficial de localidades (`servicodados.ibge.gov.br`) falhou em 16/11/2026 na execução explícita do GitHub Actions. Isso não comprova que **todas as outras fontes do IBGE estejam indisponíveis**. O IBGE publica a **Divisão Territorial Brasileira — DTB 2025** com relatórios de municípios em planilhas OpenDocument / Excel, e a tabela pública de códigos.

Fontes oficiais de descoberta:
- [Divisão Territorial Brasileira — IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/23701-divisao-territorialbrasileira) — ano 2025, relatório de municípios e tabelas em XLS/ODS/ZIP.
- [Códigos dos municípios — IBGE](https://www.ibge.gov.br/explica/codigos-dos-municipios.php) — tabela pública de geocódigos; atualização territorial sistemática.
- [Malha Municipal Digital 2025 — IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html) — **5.569 municípios**, Brasília/DF e Fernando de Noronha/PE como unidades especiais.

## Procedimento privado para operador/Codex

1. Baixar **diretamente do domínio oficial IBGE** o relatório 2025 de municípios (`RELATORIO_DTB_BRASIL_2025_MUNICIPIOS`, formato e localização definidos na página oficial). Guardar **original binário**, URL final, data, SHA-256, versão e cadeia de custódia; conferir que não houve redirecionamento não autorizado. Um print do site ou um arquivo de terceiro **não** comprova o conteúdo original.
2. Abrir o relatório com ferramenta de planilha compatível (Excel/LibreOffice) e **exportar uma cópia UTF-8** com somente três colunas nesta ordem: `ibgeCode;state;city`, ou seja, código IBGE de 7 dígitos, sigla de UF e nome. É uma **normalização manual controlada**, não uma função de leitura automática de XLS/ODS pelo Engine. Não editar valores nem mesclar fontes.
3. Salvar arquivo CSV **fora do Git** e conferir que a conversão manteve códigos de 7 dígitos, acentuação, todas as linhas e o formato delimitado por ponto e vírgula. Não exportar fórmulas, macros ou campos de cliente.
4. Obter **independentemente** a referência F110/F111 de localidades e sua evidência F117/F154 ou alternativa F119 com SHA-256 externo confiável. Não usar uma cópia do **mesmo** CSV DTB como "segunda fonte" fingindo independência.
5. Executar offline, com arquivo F110 de referência e export DTB normalizado:

```bash
node scripts/review-independent-dtb-reference-offline.mjs \
  /AREA-PRIVADA/localidades-f110.json \
  /AREA-PRIVADA/dtb-municipios-2025-normalizado.csv
```

O Engine compara códigos, UFs e nomes, ignorando diferenças de maiúsculas/acentos quando semanticamente equivalentes. O relatório preserva sigilo, traz somente contagens, categorias e até 50 índices ordinais. Não imprime nome/geocódigo real nem URL, não publica conteúdo e não acessa rede.

## Limites e detecção conservadora

A verificação aceita duas formas de exportação, conforme como as duas unidades administrativas especiais aparecem no relatório: **5.569 linhas de municípios** sem as exceções ou **5.571 linhas** com Brasília/DF e Fernando de Noronha/PE. Uma lista com apenas uma das unidades especiais, códigos duplicados, ordem incorreta, UF inconsistentes ou divergência em nome/código é **bloqueada**. A referência F110 deve satisfazer F153 da edição territorial 2025.

A aprovação do formato é **somente** `human_official_dtb_provenance_and_edition_review_required`. O resultado deixa `officialDtbWorkbookAuthenticated=false`, `independentOfficialProvenanceProved=false`, `publicationAuthorized=false` e `indexingAuthorized=false`. Um operador poderia fabricar **ambos** os arquivos; igualdade de códigos não garante autenticidade. A tabela DTB e o diretório da API podem ter escopo distinto, e o procedimento exige avaliação da edição e exceções antes de liberar.

**Códigos de saída:** 0 = somente revisão humana; 2 = divergências encontradas, BLOQUEADO; 1 = entrada inválida. A CI usa somente cidades fictícias, sem download ou dados privados.

## Pendências para liberação efetiva

Comprovar origem do workbook oficial por canal independente; rever edição, total legal e casos especiais; conteúdo real útil de cada cidade (não doorway); Portal/Sites/editorial; propriedade GSC por empresa; LGPD e segurança; staging Leaseweb sem conflito com CRM; TLS, CVE, backup/restore/rollback e autorização humana de publicação. **F156 não faz upload, download, deploy, indexação ou merge.**
