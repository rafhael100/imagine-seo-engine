# SEO F178 — normalizar a evidência de dois produtos IBGE sem mascarar divergências

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-INDEX.**

A F175 registrou diferença entre a DTB 2025 (5.571 códigos) e a publicação de Áreas Territoriais 2025 (5.573 códigos). Os códigos de Áreas adicionais foram identificados na F176 como `4300001` Área Operacional Lagoa Mirim, RS, e `4300002` Área Operacional Lagoa dos Patos, RS. A F177 reconciliou com sucesso os **5.571 códigos comuns, sem divergências de UF/nome**, após reconhecer apenas as duas áreas operacionais de nome e UF fixos.

A F178 **não transforma divergência em sucesso falso**: a CI exige que o comparador bruto F175 retorne o estado `HOLD_OFFICIAL_PRODUCT_DISAGREEMENT` com **exatamente dois registros adicionais, zero faltantes e zero nomes/UF divergentes**. Em seguida exige que o verificador F177 classifique nominalmente as duas áreas operacionais conhecidas e confirme os 5.571 registros restantes. Qualquer outro delta, saída inesperada, fonte com SHA incorreta ou exceção desconhecida faz a CI falhar.

As duas publicações são obtidas por HTTPS/TLS do host oficial IBGE, com hashes SHA-256 fixados. Os arquivos e CSV temporários não são comitados nem publicados. Os dados completos não aparecem nos logs, apenas contagens e flags.

**Limitação:** consistência entre dois produtos do mesmo IBGE não comprova autoridade independente, disponibilidade de serviço Imagine, revisão editorial nem autorização de publicar 5.569 páginas municipais. O contrato continua `releaseAuthorized=false`; o gate de produção permanece fechado para GSC por tenant, AppSec/LGPD, staging Leaseweb, backup, rollback e aprovação humana.
