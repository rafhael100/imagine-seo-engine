# SEO F177 — conciliação oficial 2025 com duas áreas operacionais excluídas

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX**.

A revisão F175 comparou a DTB 2025 (5.571 códigos) com o produto Áreas Territoriais 2025 (5.573 códigos), ambos obtidos diretamente do IBGE com hash SHA-256 fixo. Os 5.571 códigos da DTB estavam presentes na outra fonte sem divergências de UF ou nome; a F176 identificou as duas exceções públicas:

- **4300001**, RS — Área Operacional “Lagoa Mirim”.
- **4300002**, RS — Área Operacional “Lagoa dos Patos”.

Essas unidades administrativas não são municípios nem devem gerar landing pages municipais. Uma exclusão genérica de dois registros, entretanto, seria insegura: poderia mascarar novas alterações territoriais.

## Contrato F177

- Reabre as duas publicações oficiais originais sob as SHAs anteriores: DTB ZIP `d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27` e Áreas ODS `029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1`.
- Gera apenas o CSV DTB privado temporário vinculado ao SHA F172 `039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818`.
- Reconhece **exatamente** os códigos 4300001 e 4300002, sua UF RS e nomenclatura oficial. Se houver um terceiro código não esperado, uma unidade renomeada ou uma ausência de município, interrompe a conferência.
- Compara **todos os 5.571 registros restantes** por geocódigo, UF e nome; devolve somente indicadores numéricos e flags de revisão, sem exportar 5.571 nomes/códigos.
- Os testes rejeitam troca de nome, UF, código extra ou desaparecimento de município, e a rotina conserva `publicationAuthorized=false`, `indexingAuthorized=false`.

## Limites de validade

A verificação demonstra a concordância estrutural entre **dois produtos do mesmo órgão IBGE**, não entre duas autoridades independentes, e não substitui a revisão jurídica/territorial, a API Localidades indisponível ou o aval editorial para publicar páginas de serviço por município.

A implantação da Imagine continua sujeita a revisão AppSec/LGPD, integração GSC por tenant, inventário global de páginas, conteúdo local original, homologação e rollback Leaseweb e decisão humana. Nenhum merge, DNS, deploy ou indexação é realizado.
