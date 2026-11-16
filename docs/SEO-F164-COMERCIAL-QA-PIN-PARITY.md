# SEO F164 — integridade da revisão Comercial compartilhada

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**

A F158 verifica o HTML Astro compilado; a F159 executa navegação Chromium real. Ambas devem testar exatamente a mesma candidata `rafhael100/imagine-comercial` fixada por SHA.

O gate F164 confere os workflows reais no checkout e rejeita referências móveis, SHA divergente, múltiplos `ref`, checkout de repositório não aprovado e ausência de conferência de `git rev-parse HEAD`. A validação é inteiramente local e não acessa GitHub, GSC, CRM, VPS ou produção.

A igualdade dos commits não autentica a autoria do Comercial ou a cadeia de dependências. Mesmo quando a checagem aprova, `publicationAuthorized`, `mergeAuthorized` e `deployAuthorized` permanecem falsos. Revisão AppSec, origem oficial IBGE, GSC por tenant, editorial e homologação Leaseweb continuam necessários.
