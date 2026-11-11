# SEO-F42 — Consistência de identidade do plano GSC até a resposta

O analisador de respostas do Search Console aceitava um plano com fingerprint sintaticamente correto, mas sem conferir novamente se a propriedade na URL oficial da API tinha o mesmo fingerprint. Também aceitava campos extras e datas adulteradas em um plano fornecido manualmente.

Agora `validateOfflineGscQueryPlan` estabelece um contrato único para:
- domínio oficial `www.googleapis.com` e caminho de Search Analytics;
- propriedade codificada e fingerprint iguais;
- tenant, escopo readonly, HTTP POST, campo `networkPerformed=false`;
- corpo fechado com dimensão query, `web`, `final`, `byProperty`, limite e intervalo de datas válido.

O mesmo validador é usado antes da análise de respostas GSC fornecidas offline e pelo binding F40. Nenhuma confirmação de OAuth é inferida; valores devolvidos continuam sanitizados. Um backend autenticado deve aplicar seus próprios controles de tenant, consentimento, propriedade e token antes de acesso à API.
