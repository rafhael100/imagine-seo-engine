# SEO F158 — testar build Astro REAL do Comercial F334 com o Engine atual

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua [F157 #232](https://github.com/rafhael100/imagine-seo-engine/pull/232) e a auditoria de versão mais antiga F115.

## Contexto

A F115 já provava que o Engine recusa uma prévia editorial privada dentro de um build do Comercial, mas usava um **commit antigo** do Astro (`f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a`). Desde então o Comercial passou a implementar a assinatura **Visitas → Leads → Clientes**, um funil ilustrativo e uma calculadora anônima PT/EN/ES.

A F158 agora compila **o código real e imutável** da candidata [Comercial F334 PR #420](https://github.com/rafhael100/imagine-comercial/pull/420) no commit `a9fe8da962e79547d9335a46b859a09b80982081`. O teste anterior F115 permanece para comparação histórica; não é alterado.

## Testes executados em CI descartável

1. Checkout sem credenciais persistidas de SEO + Comercial na SHA F334 exata.
2. Instala dependências fixadas por `package-lock.json`, compila Astro e executa o `check:dist` nativo do Comercial (metadados, JSON-LD, sitemap/robots, headings, links e proteção de captação pública).
3. O **Engine SEO atual** reaudita todo o `dist` real, exigindo pelo menos 45 páginas indexáveis, **zero erros e zero avisos**, strict head/canonical/robots/hreflang e idiomas PT/EN/ES.
4. Exige que as 3 homepages contenham de fato a calculadora e o funil localizados, input semanal, cenários, opção de calcular e texto **explícito** de que as taxas são apenas hipóteses fictícias — **não previsões comerciais**.
5. Confere que o funil não virou `form` automático, não pede e-mail/telefone/senha no próprio componente e que o CTA segue rota local de contato do idioma, iniciada voluntariamente.
6. Verifica que o checkout Git e o Comercial ficaram intactos. Não acessa Chrome, Google real ou dados de clientes; a fonte comercial é pública e o build é feito no runner temporário.

## O que a F158 NÃO comprova

- A PR #420 ainda é candidata e pode evoluir. O resultado é válido **somente** para SHA `a9fe8da962e79547d9335a46b859a09b80982081`; atualizar o pin exige nova revisão.
- A verificação estrutural não substitui revisão editorial ou a experiência completa de navegador real, nem prova que leads chegam ao CRM.
- Não há publicação, login real, Google Search Console/OAuth, analytics, geração de páginas de municípios, TLS/DNS, homologação VPS, aprovação de cobrança ou do cliente.
- A expansão municipal exige fonte IBGE independente F156/F157, qualidade editorial genuína, revisão LGPD e aprovação humana.

**Status: laboratório de integração de verdade, sem merge/deploy em SEO ou Comercial.**
