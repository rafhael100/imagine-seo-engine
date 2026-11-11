# SEO-F85 — Política única de ocultação de consultas pessoais GSC

## Inconsistência corrigida

O módulo de **consultas por página** já tratava CPF `123.456.789-09` e CNPJ `12.345.678/0001-90` como consultas privadas, mas o analisador de consultas e os relatórios CSV/JSON só reconheciam e-mails, telefones e documentos rotulados. Isso permitia que identificadores brasileiros formatados fossem **contabilizados como tráfego analisado** na exportação simples, produzindo métricas não comparáveis entre módulos.

## Implementação

- Novo `src/gsc-private-query.mjs`: função `isSensitiveGscQuery(value)` com o mesmo filtro sintático conservador que já era usado no módulo de query/page, cobrindo e-mail, telefone e CPF/CNPJ formatados ou precedidos de rótulo.
- `src/opportunities.mjs` e `src/gsc-query-page-overlap.mjs` agora compartilham exatamente essa função; a filtragem precede a agregação e permanece sem ecoar termos, URL ou token.
- Testes exercitam classificação isolada, importação CSV, relatório JSON e paridade com análise query/page de propriedade sintética. Comparam contagens redacted, impressões/clicks analisados e ausência de PII na saída.
- O filtro é **heurístico**, não garante detectar toda PII e também pode redigir termos legítimos que se pareçam com documentos; a decisão conservadora evita exposição acidental.

## Segurança e ativação

Sem Search Console real, OAuth, prova de titularidade, credencial, publicação, cadastro de cliente, processamento em produção, gravação de relatórios, deploy ou merge main. Os dados dos testes são completamente sintéticos.

**DRAFT/NO-GO:** CI Node22/24, revisão independente AppSec/LGPD/SEO e validação futura de integração Portal/Comercial antes de promover qualquer SHA.
