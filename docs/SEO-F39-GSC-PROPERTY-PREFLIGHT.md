# SEO-F39 — Property preflight offline para GSC

Motivação: a presença de uma conta Google com acesso a propriedades de outros clientes não autoriza consumir qualquer uma delas para a Imagine.

O contrato `reviewOfflineGscPropertyPreflight` recebe uma lista de propriedades **fornecida manualmente**, sem conexão de rede, e apenas:
- normaliza identificadores HTTPS URL-prefix ou `sc-domain:`;
- exige correspondência exata da propriedade solicitada (não infere acesso cruzado);
- distingue declaração de permissão de leitura de acesso não verificado;
- retorna somente fingerprint do alvo e indicadores de revisão; não reproduz nomes, URLs ou termos das outras propriedades;
- mantém `productionReadAuthorized=false`, `oauthVerified=false`, `portalTenantGrantVerified=false` e `propertyConsentVerified=false` em todos os casos.

Qualquer leitura real dependerá de um backend confiável autenticando OAuth `webmasters.readonly`, propriedade, tenant/grant, finalidade e consentimento. Este módulo não recebe tokens, não cria sessão, não vincula o OpenSEO e não altera o Google.
