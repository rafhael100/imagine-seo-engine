# SEO F179 — rascunhos editoriais vinculados à referência DTB oficial

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.** Esta entrega continua a [RC65 #266](https://github.com/rafhael100/imagine-seo-engine/pull/266), sem refazer a F110/F107 ou as validações territoriais F172–F178.

## Problema

O motor editorial F107 pode filtrar páginas de conteúdo repetitivo, mas recebe geocódigos fornecidos pelo operador. F110 confere contra uma referência também fornecida pelo operador. Agora que a F172 obteve por TLS e normalizou a **DTB 2025 oficial**, precisamos impedir que rascunhos municipais apresentem UF, nome ou ID divergentes do cadastro recebido.

## Implementação

O novo módulo `src/geo-pinned-official-editorial-gate.mjs` recebe exatamente:
- `normalizedDtbCsv`: bytes UTF-8 do CSV privado produzido pela F172;
- `draftBatchInput`: lote original do motor editorial F107 (até 25 candidatos, conteúdo limitado, inventário parcial, evidências, limiar de similaridade).

Exige o SHA-256 **exato** do CSV normalizado F172: `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`. Valida novamente a lista pelo parser F156, com 5.571 códigos e duas unidades especiais. **Nunca aceita um resumo F107 de aprovação autodeclarado**: executa novamente a triagem a partir do lote original.

Para cada rascunho, verifica existência do geocódigo oficial, UF e nome normalizado. Bloqueia códigos desconhecidos, nomes e UFs divergentes, Brasília/DF e Fernando de Noronha/PE quando indevidamente tratados como municípios comuns, além de todos os bloqueios editoriais originais (ausência de serviço local, falta de demanda e conteúdos redundantes).

O CLI `scripts/review-pinned-dtb-editorial-batch-offline.mjs` lê dois arquivos privados com modo `0600` em POSIX, recusa symlinks, limita tamanho e não reproduz município, conteúdo, leads ou identificadores na saída. Retorna apenas contagens, índice do rascunho e motivos de revisão em códigos fixos.

## Evidência técnica

- A CI F179 valida contratos Node 22/24 e entradas adversariais com dados fictícios.
- A CI **F172 existente** foi estendida para executar o F179 contra o **CSV real da DTB oficial já capturado e verificado pela SHA**, com um único rascunho fictício sem disponibilidade e sem evidência comercial. O teste exige `matchedOfficialDtbCodes=1`, `blockedDrafts=1` e `publicationAuthorized=false`. Nenhum novo endpoint ou segundo download é necessário.
- As duas publicações IBGE da RC65 concordam sobre os 5.571 códigos municipais/territoriais após a exclusão estrita das duas áreas operacionais extras do RS; esse resultado não é prova de oferta comercial real.

## Restrições de release

Mesmo rascunhos com códigos e nomes corretos permanecem `human_editorial_review_required` e **não podem ser publicados ou indexados** automaticamente. A DTB não demonstra demanda de busca, originalidade do texto, cobertura real do serviço, consentimento de clientes ou aprovação humana.

Continuam pendentes o uso real de GSC por tenant no próprio Engine, revisão independente de conteúdo e segurança, URLs históricas, homologação segura da Leaseweb, backup/restauração e rollback com aceite formal. Nenhuma alteração em main/DNS/produção é realizada.
